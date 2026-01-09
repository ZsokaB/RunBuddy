using Microsoft.AspNetCore.Mvc;
using Microsoft.ML;
using Microsoft.ML.Data;
using RunningBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace RunningBackend.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class TrainingController : ControllerBase
	{
		public class RunPrediction
		{
			[ColumnName("Score")]
			public float PredictedDistance { get; set; }
			

		}
		[HttpGet("predict-10k-plan")]
		public IActionResult Predict10KPlan()
		{
			var mlContext = new MLContext();

			// Sample Historical Run Data
			var runDataList = new List<RunData>
	{

new RunData { Week = 1, Day = 1, DistanceM = 1800f, PaceSeconds = 650f, RatingNumeric = 2f },
new RunData { Week = 1, Day = 2, DistanceM = 2000f, PaceSeconds = 640f, RatingNumeric = 2f },
new RunData { Week = 1, Day = 3, DistanceM = 2200f, PaceSeconds = 630f, RatingNumeric = 2f },

new RunData { Week = 2, Day = 1, DistanceM = 2400f, PaceSeconds = 620f, RatingNumeric = 3f },
new RunData { Week = 2, Day = 2, DistanceM = 2600f, PaceSeconds = 610f, RatingNumeric = 3f },
new RunData { Week = 2, Day = 3, DistanceM = 2800f, PaceSeconds = 600f, RatingNumeric = 3f },

new RunData { Week = 3, Day = 1, DistanceM = 3000f, PaceSeconds = 590f, RatingNumeric = 3f },
new RunData { Week = 3, Day = 2, DistanceM = 3200f, PaceSeconds = 580f, RatingNumeric = 4f },
new RunData { Week = 3, Day = 3, DistanceM = 3400f, PaceSeconds = 570f, RatingNumeric = 4f },

new RunData { Week = 4, Day = 1, DistanceM = 3600f, PaceSeconds = 560f, RatingNumeric = 4f },
new RunData { Week = 4, Day = 2, DistanceM = 3800f, PaceSeconds = 550f, RatingNumeric = 4f },
new RunData { Week = 4, Day = 3, DistanceM = 4000f, PaceSeconds = 540f, RatingNumeric = 4f },

new RunData { Week = 5, Day = 1, DistanceM = 4200f, PaceSeconds = 530f, RatingNumeric = 5f },
new RunData { Week = 5, Day = 2, DistanceM = 4400f, PaceSeconds = 520f, RatingNumeric = 5f },
new RunData { Week = 5, Day = 3, DistanceM = 4600f, PaceSeconds = 510f, RatingNumeric = 5f },

new RunData { Week = 6, Day = 1, DistanceM = 4800f, PaceSeconds = 500f, RatingNumeric = 5f },
new RunData { Week = 6, Day = 2, DistanceM = 5000f, PaceSeconds = 490f, RatingNumeric = 5f },
new RunData { Week = 6, Day = 3, DistanceM = 5200f, PaceSeconds = 480f, RatingNumeric = 5f },

new RunData { Week = 7, Day = 1, DistanceM = 5400f, PaceSeconds = 470f, RatingNumeric = 5f },
new RunData { Week = 7, Day = 2, DistanceM = 5600f, PaceSeconds = 460f, RatingNumeric = 5f },
new RunData { Week = 7, Day = 3, DistanceM = 5800f, PaceSeconds = 450f, RatingNumeric = 5f },

new RunData { Week = 8, Day = 1, DistanceM = 6000f, PaceSeconds = 440f, RatingNumeric = 4f },
new RunData { Week = 8, Day = 2, DistanceM = 6200f, PaceSeconds = 430f, RatingNumeric = 4f },
new RunData { Week = 8, Day = 3, DistanceM = 6400f, PaceSeconds = 420f, RatingNumeric = 4f },

	};

			// Add Previous Run Data Features
			for (int i = 1; i < runDataList.Count; i++)
			{
				runDataList[i].PreviousRunRating = runDataList[i - 1].RatingNumeric;
				runDataList[i].PreviousDistanceM = runDataList[i - 1].DistanceM;
				runDataList[i].PreviousPaceSeconds = runDataList[i - 1].PaceSeconds;
			}

			runDataList[0].PreviousRunRating = 3f;
			runDataList[0].PreviousDistanceM = 1900f;
			runDataList[0].PreviousPaceSeconds = 546f;

			// Compute Weekly Stats
			foreach (var weekGroup in runDataList.GroupBy(r => r.Week))
			{
				float weeklyTotalDistance = weekGroup.Sum(r => r.DistanceM);
				float weeklyAveragePace = weekGroup.Average(r => r.PaceSeconds);

				foreach (var run in weekGroup)
				{
					run.WeeklyTotalDistance = weeklyTotalDistance;
					run.WeeklyAveragePace = weeklyAveragePace;
				}
			}

			// Load data into ML context
			var data = mlContext.Data.LoadFromEnumerable(runDataList);

			// Define the training pipeline for distance prediction
			var distancePipeline = mlContext.Transforms.Concatenate("Features",
		nameof(RunData.Week),
		nameof(RunData.Day),
		nameof(RunData.PreviousRunRating),
		nameof(RunData.PreviousDistanceM),
		nameof(RunData.PreviousPaceSeconds),
		nameof(RunData.WeeklyTotalDistance),
		nameof(RunData.WeeklyAveragePace))
		.Append(mlContext.Transforms.Categorical.OneHotEncoding("Week", "Week"))
		.Append(mlContext.Transforms.Categorical.OneHotEncoding("Day", "Day"))
		.Append(mlContext.Transforms.NormalizeMinMax("Features"))
		.Append(mlContext.Regression.Trainers.Sdca(
			labelColumnName: nameof(RunData.DistanceM),
			featureColumnName: "Features"));

			var distanceModel = distancePipeline.Fit(data);

			var distancePredictionEngine = mlContext.Model.CreatePredictionEngine<RunData, RunPrediction>(distanceModel);

			var predictedPlan = new List<object>();
			var latestRun = runDataList.Last();
			float previousDistance = latestRun.DistanceM;
			float previousPace = latestRun.PaceSeconds;
			float previousRating = latestRun.RatingNumeric;
			int currentWeek = (int)latestRun.Week + 1;

			for (int week = currentWeek; week < currentWeek + 8; week++)
			{
				float weeklyTotalDistance = 0;
				float weeklyAveragePace = previousPace;

				for (int day = 1; day <= 3; day++)
				{
					// Prepare input for predictions
					var input = new RunData
					{
						Week = week,
						Day = day,
						PreviousRunRating = previousRating,
						PreviousDistanceM = previousDistance,
						PreviousPaceSeconds = previousPace,
						WeeklyTotalDistance = weeklyTotalDistance,
						WeeklyAveragePace = weeklyAveragePace
					};

					// Predict distance & pace
					var predictedDistance = distancePredictionEngine.Predict(input).PredictedDistance;
					var predictedDistance3day = 0f;
					// Ensure realistic values (but no manual increments)
					predictedDistance = Math.Max(predictedDistance, previousDistance); // Ensure no extreme drops
					if (predictedDistance > 10000f) predictedDistance = 10000f; // Cap at 10K

					// Pace should not go below 6:00 min/km

					if (day == 3)
					{
						predictedDistance3day = predictedDistance * 1.1f; // Increase distance by 5%
						weeklyTotalDistance += predictedDistance3day;
						

						predictedPlan.Add(new
						{
							Week = week,
							Day = day,
							DistanceKm = (float)Math.Round(predictedDistance3day / 1000f, 2),

						});
						;
					}

					else
					{
						predictedPlan.Add(new
						{
							Week = week,
							Day = day,


							DistanceKm = (float)Math.Round(predictedDistance / 1000f, 2),
						});


						weeklyTotalDistance += predictedDistance;
					}


					previousDistance = predictedDistance;

					previousRating = 4f; 
				}
			}

			return Ok(predictedPlan);
		}

		[HttpGet("predictnextrun")]
		public IActionResult PredictNextWeekPlan()
		{
			var mlContext = new MLContext();

			// Sample Historical Run Data
			var runDataList = new List<RunData>
	{

//new RunData { Week = 1, Day = 1, DistanceM = 1800f, PaceSeconds = 650f, RatingNumeric = 2f },
//new RunData { Week = 1, Day = 2, DistanceM = 2000f, PaceSeconds = 640f, RatingNumeric = 2f },
//new RunData { Week = 1, Day = 3, DistanceM = 2200f, PaceSeconds = 630f, RatingNumeric = 2f },

//new RunData { Week = 2, Day = 1, DistanceM = 2400f, PaceSeconds = 620f, RatingNumeric = 3f },
//new RunData { Week = 2, Day = 2, DistanceM = 2600f, PaceSeconds = 610f, RatingNumeric = 3f },
//new RunData { Week = 2, Day = 3, DistanceM = 2800f, PaceSeconds = 600f, RatingNumeric = 3f },

//new RunData { Week = 3, Day = 1, DistanceM = 3000f, PaceSeconds = 590f, RatingNumeric = 3f },
//new RunData { Week = 3, Day = 2, DistanceM = 3200f, PaceSeconds = 580f, RatingNumeric = 4f },
//new RunData { Week = 3, Day = 3, DistanceM = 3400f, PaceSeconds = 570f, RatingNumeric = 4f },

//new RunData { Week = 4, Day = 1, DistanceM = 3600f, PaceSeconds = 560f, RatingNumeric = 4f },
//new RunData { Week = 4, Day = 2, DistanceM = 3800f, PaceSeconds = 550f, RatingNumeric = 4f },
//new RunData { Week = 4, Day = 3, DistanceM = 4000f, PaceSeconds = 540f, RatingNumeric = 4f },

//new RunData { Week = 5, Day = 1, DistanceM = 4200f, PaceSeconds = 530f, RatingNumeric = 5f },
//new RunData { Week = 5, Day = 2, DistanceM = 4400f, PaceSeconds = 520f, RatingNumeric = 5f },
//new RunData { Week = 5, Day = 3, DistanceM = 4600f, PaceSeconds = 510f, RatingNumeric = 5f },

//new RunData { Week = 6, Day = 1, DistanceM = 4800f, PaceSeconds = 500f, RatingNumeric = 5f },
//new RunData { Week = 6, Day = 2, DistanceM = 5000f, PaceSeconds = 490f, RatingNumeric = 5f },
//new RunData { Week = 6, Day = 3, DistanceM = 5200f, PaceSeconds = 480f, RatingNumeric = 5f },

//new RunData { Week = 7, Day = 1, DistanceM = 5400f, PaceSeconds = 470f, RatingNumeric = 5f },
//new RunData { Week = 7, Day = 2, DistanceM = 5600f, PaceSeconds = 460f, RatingNumeric = 5f },
//new RunData { Week = 7, Day = 3, DistanceM = 5800f, PaceSeconds = 450f, RatingNumeric = 5f },

//new RunData { Week = 8, Day = 1, DistanceM = 6000f, PaceSeconds = 440f, RatingNumeric = 4f },
//new RunData { Week = 8, Day = 2, DistanceM = 6200f, PaceSeconds = 430f, RatingNumeric = 4f },
//new RunData { Week = 8, Day = 3, DistanceM = 6400f, PaceSeconds = 420f, RatingNumeric = 4f },
//new RunData { Week = 9, Day = 1, DistanceM = 6200f, PaceSeconds = 420f, RatingNumeric = 4f },
//new RunData { Week = 9, Day = 2, DistanceM = 6400f, PaceSeconds = 420f, RatingNumeric = 4f },
//new RunData { Week = 9, Day = 3, DistanceM = 7000f, PaceSeconds = 420f, RatingNumeric = 4f },
new RunData { Week = 1, Day = 1, DistanceM = 1500f, PaceSeconds = 670f, RatingNumeric = 2f },
new RunData { Week = 1, Day = 2, DistanceM = 1900f, PaceSeconds = 690f, RatingNumeric = 2f },
new RunData { Week = 1, Day = 3, DistanceM = 2100f, PaceSeconds = 680f, RatingNumeric = 2f },

new RunData { Week = 2, Day = 1, DistanceM = 2400f, PaceSeconds = 710f, RatingNumeric = 3f },
new RunData { Week = 2, Day = 2, DistanceM = 2500f, PaceSeconds = 740f, RatingNumeric = 3f },
new RunData { Week = 2, Day = 3, DistanceM = 2700f, PaceSeconds = 730f, RatingNumeric = 3f },

new RunData { Week = 3, Day = 1, DistanceM = 2600f, PaceSeconds = 720f, RatingNumeric = 3f },
new RunData { Week = 3, Day = 2, DistanceM = 3100f, PaceSeconds = 700f, RatingNumeric = 4f },
new RunData { Week = 3, Day = 3, DistanceM = 3300f, PaceSeconds = 710f, RatingNumeric = 4f },

new RunData { Week = 4, Day = 1, DistanceM = 3400f, PaceSeconds = 690f, RatingNumeric = 4f },
new RunData { Week = 4, Day = 2, DistanceM = 3100f, PaceSeconds = 710f, RatingNumeric = 4f },
new RunData { Week = 4, Day = 3, DistanceM = 3900f, PaceSeconds = 700f, RatingNumeric = 4f },

new RunData { Week = 5, Day = 1, DistanceM = 4100f, PaceSeconds = 730f, RatingNumeric = 5f },
new RunData { Week = 5, Day = 2, DistanceM = 4300f, PaceSeconds = 750f, RatingNumeric = 5f },
new RunData { Week = 5, Day = 3, DistanceM = 4500f, PaceSeconds = 740f, RatingNumeric = 5f },

new RunData { Week = 6, Day = 1, DistanceM = 4700f, PaceSeconds = 760f, RatingNumeric = 5f },
new RunData { Week = 6, Day = 2, DistanceM = 4900f, PaceSeconds = 770f, RatingNumeric = 5f },
new RunData { Week = 6, Day = 3, DistanceM = 5100f, PaceSeconds = 780f, RatingNumeric = 5f },

new RunData { Week = 7, Day = 1, DistanceM = 5300f, PaceSeconds = 800f, RatingNumeric = 5f },
new RunData { Week = 7, Day = 2, DistanceM = 5500f, PaceSeconds = 810f, RatingNumeric = 5f },
new RunData { Week = 7, Day = 3, DistanceM = 5700f, PaceSeconds = 820f, RatingNumeric = 5f },

new RunData { Week = 8, Day = 1, DistanceM = 5900f, PaceSeconds = 840f, RatingNumeric = 4f },
new RunData { Week = 8, Day = 2, DistanceM = 6100f, PaceSeconds = 850f, RatingNumeric = 4f },
new RunData { Week = 8, Day = 3, DistanceM = 6300f, PaceSeconds = 860f, RatingNumeric = 4f },
	};

			// Add Previous Run Data Features
			for (int i = 1; i < runDataList.Count; i++)
			{
				runDataList[i].PreviousRunRating = runDataList[i - 1].RatingNumeric;
				runDataList[i].PreviousDistanceM = runDataList[i - 1].DistanceM;
				runDataList[i].PreviousPaceSeconds = runDataList[i - 1].PaceSeconds;
			}

			runDataList[0].PreviousRunRating = 3f;
			runDataList[0].PreviousDistanceM = 1900f;
			runDataList[0].PreviousPaceSeconds = 546f;

			// Compute Weekly Stats
			foreach (var weekGroup in runDataList.GroupBy(r => r.Week))
			{
				float weeklyTotalDistance = weekGroup.Sum(r => r.DistanceM);
				float weeklyAveragePace = weekGroup.Average(r => r.PaceSeconds);

				foreach (var run in weekGroup)
				{
					run.WeeklyTotalDistance = weeklyTotalDistance;
					run.WeeklyAveragePace = weeklyAveragePace;
				}
			}

			// Load data into ML context
			var data = mlContext.Data.LoadFromEnumerable(runDataList);

			// Define the training pipeline for distance prediction
			var distancePipeline = mlContext.Transforms.Concatenate("Features",
		nameof(RunData.Week),
		nameof(RunData.Day),
		nameof(RunData.PreviousRunRating),
		nameof(RunData.PreviousDistanceM),
		nameof(RunData.PreviousPaceSeconds),
		nameof(RunData.WeeklyTotalDistance),
		nameof(RunData.WeeklyAveragePace))
		.Append(mlContext.Transforms.Categorical.OneHotEncoding("Week", "Week"))
		.Append(mlContext.Transforms.Categorical.OneHotEncoding("Day", "Day"))
		.Append(mlContext.Transforms.NormalizeMinMax("Features"))
		.Append(mlContext.Regression.Trainers.Sdca(
			labelColumnName: nameof(RunData.DistanceM),
			featureColumnName: "Features"));

			var distanceModel = distancePipeline.Fit(data);

			var distancePredictionEngine = mlContext.Model.CreatePredictionEngine<RunData, RunPrediction>(distanceModel);

			var predictedPlan = new List<object>();
			var latestRun = runDataList.Last();
			float previousDistance = latestRun.DistanceM;
			float previousPace = latestRun.PaceSeconds;
			float previousRating = latestRun.RatingNumeric;
			int currentWeek = (int)latestRun.Week + 1;

			for (int week = currentWeek; week < currentWeek + 1; week++)
			{
				float weeklyTotalDistance = 0;
				float weeklyAveragePace = previousPace;

				for (int day = 1; day <= 3; day++)
				{
					// Prepare input for predictions
					var input = new RunData
					{
						Week = week,
						Day = day,
						PreviousRunRating = previousRating,
						PreviousDistanceM = previousDistance,
						PreviousPaceSeconds = previousPace,
						WeeklyTotalDistance = weeklyTotalDistance,
						WeeklyAveragePace = weeklyAveragePace
					};

					// Predict distance & pace
					var predictedDistance = distancePredictionEngine.Predict(input).PredictedDistance;
					var predictedDistance3day = 0f;
					// Ensure realistic values (but no manual increments)
					predictedDistance = Math.Max(predictedDistance, previousDistance); // Ensure no extreme drops
					if (predictedDistance > 10000f) predictedDistance = 10000f; // Cap at 10K

					// Pace should not go below 6:00 min/km

					if (day == 3)
					{
						predictedDistance3day = predictedDistance * 1.1f; // Increase distance by 5%
						weeklyTotalDistance += predictedDistance3day;


						predictedPlan.Add(new
						{
							Week = week,
							Day = day,
							DistanceKm = (float)Math.Round(predictedDistance3day / 1000f, 2),

						});
						;
					}

					else
					{
						predictedPlan.Add(new
						{
							Week = week,
							Day = day,


							DistanceKm = (float)Math.Round(predictedDistance / 1000f, 2),
						});


						weeklyTotalDistance += predictedDistance;
					}


					previousDistance = predictedDistance;

					previousRating = 4f;
				}
			}

			return Ok(predictedPlan);
		}


		public class RunData
		{
			public float Week { get; set; }
			public float Day { get; set; }
			public float DistanceM { get; set; }
			public float PaceSeconds { get; set; }
			public float RatingNumeric { get; set; }
			public float PreviousRunRating { get; set; }
			public float PreviousPaceSeconds { get; set; }
			public float PreviousDistanceM { get; set; }
			public float WeeklyTotalDistance { get; set; }
			public float WeeklyAveragePace { get; set; }
		}
	}
}
