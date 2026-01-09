using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RunningBackend.Models
{
	public class Coordinate
	{
		public int Id { get; set; }
        public double Longitude { get; set; }
		public double Latitude { get; set; }
		public int RunId { get; set; }
		[JsonIgnore]
		public Run Run { get; set; }
	}
}
