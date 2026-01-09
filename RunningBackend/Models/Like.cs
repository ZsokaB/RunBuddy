namespace RunningBackend.Models
{
	public class Like
	{
		
			public int Id { get; set; }
			public int RunId { get; set; }
			public string UserId { get; set; }
			public Run Run { get; set; }
		
	}
}
