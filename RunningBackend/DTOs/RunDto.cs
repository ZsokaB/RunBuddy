using RunningBackend.Models;
using System.ComponentModel.DataAnnotations;

namespace RunningBackend.DTOs;
public class RunDto
{
	[Required]
	public double Distance { get; set; }
	[Required]
	public TimeSpan Duration { get; set; }
	[Required]
	public int Pace { get; set; }
	[Required]
	public DateTime Date { get; set; }
	public string Note { get; set; }
	[Required]
	public int Rating { get; set; }
	[Required]
	public int Calories { get; set; }
	[Required]
	public string Type { get; set; }

	public List<Coordinate> Coordinates { get; set; }
    public List<KilometerPace> KilometerPaces { get; set; }

}