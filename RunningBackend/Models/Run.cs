using System.ComponentModel.DataAnnotations;

namespace RunningBackend.Models
{
	public class Run
	{
		[Required]
		public int Id { get; set; }
		[Required]
		public string UserId { get; set; }
		[Required]
		public double Distance { get; set; }
		[Required]
		public TimeSpan Duration { get; set; }
		[Required]
		public int Pace { get; set; }
		[Required]
		public DateTime Date { get; set; }
		public string Image { get; set; }
		public string Note { get; set; }
		
		public int Rating { get; set; }
		[Required]
		public int Calories { get; set; }
		[Required]
		public string Type { get; set; }
	
		[Required]
		public ApplicationUser User { get; set; }
		public List<Coordinate> Coordinates { get; set; } = new List<Coordinate>();
		
		public List<KilometerPace> KilometerPaces { get; set; }

		public List<Like> Likes { get; set; } = new();
		public List<Comment> Comments { get; set; } = new();
	}
}