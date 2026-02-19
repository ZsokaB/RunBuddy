using Microsoft.ML.Data;

namespace RunningBackend.Models
{
	
		public class RunData
		{
			public int Week { get; set; }
			public int Day { get; set; }
		[ColumnName("Label")]
		
		public float DistanceKm { get; set; }
			public float PaceMinPerKm { get; set; }
			public float RatingNumeric { get; set; }
		public float PreviousRunRating { get; set; }
		public float PreviousDistanceKm { get; set; } 


		
	}


}
