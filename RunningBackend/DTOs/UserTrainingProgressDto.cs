using RunningBackend.Models;

namespace RunningBackend.DTOs
{
	public class UserTrainingProgressDto
	{
		public int Id { get; set; }

		public string UserId { get; set; }
		public int TrainingWeek { get; set; }
		public int TrainingDay { get; set; }

		public DateTime CompletionDate { get; set; }

		public ApplicationUser User { get; set; }
	}
}

