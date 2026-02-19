namespace RunningBackend.DTOs
{
	public class ChallengeProgressDto
	{
		public int ChallengeId { get; set; }
		public string InviterName { get; set; }
		public string InviteeName { get; set; }
		public double InviterDistance { get; set; }
		public double InviteeDistance { get; set; }
		public double TotalDistance { get; set; }
		public double GoalDistance { get; set; }
		public double Progress { get; set; } 
		public string Status { get; set; } 
		public string ChallengeType { get; set; }
	}

}