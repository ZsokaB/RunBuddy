using System.ComponentModel.DataAnnotations;

namespace RunningBackend.DTOs
{
	public class RegisterDto
	{
		[Required]
		public string Username { get; set; }
		[Required]
		public string Email { get; set; }
		[Required]
		public string Password { get; set; }
		[Required]
		public string FirstName { get; set; }
		[Required]
		public string LastName { get; set; }
		[Required]
		public string Gender { get; set; }
		[Required]
		public int Weight { get; set; }
		[Required]
		public int Height { get; set; }
		[Required]
		public DateTime Birthdate { get; set; }

		


	}
}