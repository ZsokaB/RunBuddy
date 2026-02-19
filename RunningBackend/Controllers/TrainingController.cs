using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.ML;
using Microsoft.ML.Data;
using RunningBackend.Data;
using RunningBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace RunningBackend.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class TrainingController : ControllerBase
	{

		private readonly ApplicationDbContext _context;
		private readonly UserManager<ApplicationUser> _userManager;
		public TrainingController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
		{
			_context = context;
			_userManager = userManager;
		}
		public class RunPrediction
		{
			[ColumnName("Score")]
			public float PredictedDistance { get; set; }
			

		}
		public class WeeklyRunPrediction
		{
			[ColumnName("Score")]
			public float PredictedDistance { get; set; }


		}
		[HttpGet("predictnextrun")]
		public IActionResult PredictNextRun()
		{
			var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

			
			var runs = _context.Runs
				.Where(r => r.UserId == userId && !r.Type.Contains("Free Run"))
				.ToList();

			
			var runDataList = runs
				.Select(r => new RunData
				{
					Week = ExtractWeek(r.Type), 
					Day = ExtractDay(r.Type),  
					DistanceM = (float)r.Distance,    
					
				})
				.OrderBy(r => r.Week)
				.ThenBy(r => r.Day)
				.ToList();

			var initialDistance = runDataList.First().DistanceM;

			for (int i = 0; i < runDataList.Count; i++)
			{
				if (i > 0)
				{
					runDataList[i].PreviousDistanceM = runDataList[i - 1].DistanceM;
					runDataList[i].DistanceProgressM = runDataList[i].DistanceM - initialDistance;
				}

				runDataList[i].CumulativeDistanceM = runDataList.Take(i + 1).Sum(r => r.DistanceM);

				int startIndex = Math.Max(0, i - 2);
				runDataList[i].TirednessIndex = runDataList.Skip(startIndex).Take(i - startIndex + 1).Sum(r => r.DistanceM);
			}

			var mlContext = new MLContext();
			var data = mlContext.Data.LoadFromEnumerable(runDataList);

			var distancePipeline = mlContext.Transforms.Concatenate("Features",
					nameof(RunData.Week),
					nameof(RunData.Day),
					nameof(RunData.PreviousDistanceM),
					nameof(RunData.DistanceProgressM),
					nameof(RunData.CumulativeDistanceM),
					nameof(RunData.TirednessIndex))
				.Append(mlContext.Transforms.NormalizeMinMax("Features"))
				.Append(mlContext.Regression.Trainers.Sdca(
					labelColumnName: nameof(RunData.DistanceM),
					featureColumnName: "Features"));

			var distanceModel = distancePipeline.Fit(data);
			var distancePredictionEngine = mlContext.Model.CreatePredictionEngine<RunData, RunPrediction>(distanceModel);

			var predictedPlan = new List<object>();
			var latestRun = runDataList.Last();
			
			float nextDay = latestRun.Day == 3 ? 1 : (float)(latestRun.Day + 1);
			float nextWeek = nextDay == 1 ? (float)(latestRun.Week + 1) : latestRun.Week;  



			var input = new RunData
			{
				Week = nextWeek,  
				Day = nextDay,

			
			 
				PreviousDistanceM = latestRun.DistanceM,
				DistanceProgressM = latestRun.DistanceM - initialDistance,
				CumulativeDistanceM = runDataList.Sum(r => r.DistanceM),
				TirednessIndex = runDataList.Skip(Math.Max(0, runDataList.Count - 3)).Sum(r => r.DistanceM)
			};

			var predictedDistance = distancePredictionEngine.Predict(input).PredictedDistance;

			predictedPlan.Add(new
			{
				Week = input.Week,
				Day = input.Day,
				DistanceKm = (float)Math.Round(predictedDistance / 1000f, 2),
			});

			float distanceKm = (float)Math.Round(predictedDistance / 1000f, 2);
			return Ok(distanceKm);
		}

		private int ExtractWeek(string runType)
		{
			var match = Regex.Match(runType, @"Week (\d+)");
			return match.Success ? int.Parse(match.Groups[1].Value) : 0;
		}

		private int ExtractDay(string runType)
		{
			var match = Regex.Match(runType, @"Day (\d+)");
			return match.Success ? int.Parse(match.Groups[1].Value) : 0;
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
			public float DistanceProgressM { get; set; }
			public float CumulativeDistanceM { get; set; }
			public float TirednessIndex { get; set; }
		}
	}
}
