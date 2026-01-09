namespace RunningBackend.Models
{
	public class UserTrainingProgress
	{
		public int Id { get; set; }

		public string UserId { get; set; } 
		public int TrainingWeek { get; set; }
		public int TrainingDay { get; set; }

		public DateTime CompletionDate { get; set; } 

		public ApplicationUser User { get; set; }
	}
}
