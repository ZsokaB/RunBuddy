using Microsoft.AspNetCore.Identity;
using System;

namespace RunningBackend.Models
{
	public class ApplicationUser : IdentityUser
	{
		
		public string FirstName { get; set; }
		public string LastName { get; set; }
		public string Gender { get; set; } 
		public int Weight { get; set; }    
		public int Height { get; set; }    
		public DateTime Birthdate { get; set; }
		public string ProfileImagePath { get; set; }
	}
}

