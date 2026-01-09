namespace RunningBackend.Models
{
	public class UserConnection
	{
		public int Id { get; set; }
		public string FollowingUserId { get; set; } 
		public string FollowedUserId { get; set; }  
		public DateTime ConnectedOn { get; set; } = DateTime.Now;

		
		public ApplicationUser FollowingUser { get; set; }
		public ApplicationUser FollowedUser { get; set; }
	}
}