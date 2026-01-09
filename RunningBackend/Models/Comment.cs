using System.Text.Json.Serialization;

namespace RunningBackend.Models
{
	public class Comment
	{
		public int Id { get; set; }
		public int RunId { get; set; }
		public string UserId { get; set; }
		public string Text { get; set; }
		public DateTime CreatedAt { get; set; }
		[JsonIgnore]
		public Run Run { get; set; }
	}
}
