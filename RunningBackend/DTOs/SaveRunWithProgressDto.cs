namespace RunningBackend.DTOs
{
	public class SaveRunWithProgressDto
	{
		
			public double Distance { get; set; }
			public TimeSpan Duration { get; set; }
			public int Pace { get; set; }
			public DateTime Date { get; set; }
			public List<KilometerPaceDto> KilometerPaces { get; set; }
			public int Calories { get; set; }
			public int Rating { get; set; }
			public string? Note { get; set; }
			public string Type { get; set; }
			public List<CoordinateDto> Coordinates { get; set; }

			public int TrainingWeek { get; set; }
			public int TrainingDay { get; set; }
		}

	

	}

