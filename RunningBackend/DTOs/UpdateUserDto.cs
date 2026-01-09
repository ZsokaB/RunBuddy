namespace RunningBackend.DTOs
{
	public class UpdateUserDto
	{
		public string Username { get; set; }
		public string CurrentPassword { get; set; }
		public string NewPassword { get; set; }

		public string Email { get; set; }
		public string FirstName { get; set; }
			public string LastName { get; set; }
			public string Gender { get; set; }
			public int Weight { get; set; }
			public int Height { get; set; }
			public DateTime Birthdate { get; set; }
		}

	}

