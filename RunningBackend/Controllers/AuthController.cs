using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using RunningBackend.Models;  // Ensure this points to where ApplicationUser is defined
using RunningBackend.DTOs;
using Microsoft.Extensions.Configuration.UserSecrets;   // Ensure this points to where RegisterDto and LoginDto are defined

namespace YourNamespace.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class AuthController : ControllerBase
	{
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly IConfiguration _configuration;

		public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
		{
			_userManager = userManager;
			_configuration = configuration;
		}

		[HttpPost("register")]
		public async Task<IActionResult> Register([FromBody] RegisterDto model)
		{
			var user = new ApplicationUser
			{
				UserName = model.Username,
				Email = model.Email,
				FirstName = model.FirstName,
				LastName = model.LastName,
				Gender = model.Gender,
				Weight = model.Weight,
				Height = model.Height,
				Birthdate = model.Birthdate

			};
			var result = await _userManager.CreateAsync(user, model.Password);
			if (!result.Succeeded)
			{
				var errors = result.Errors.Select(e => e.Description).ToList();
				return BadRequest(new { Message = "Registration failed", Errors = errors });
			}

			return Ok(new { Message = "User registered successfully", UserId = user.Id });
		}

		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] LoginDto model)
		{
			// Find the user by username
			var user = await _userManager.FindByNameAsync(model.Username);

			if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
			{
				// Log the error for debugging
				Console.WriteLine("Login failed: Incorrect username or password.");
				return Unauthorized();
			}

			// Create the JWT token
			var tokenHandler = new JwtSecurityTokenHandler();
			var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);
			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(new[]
				{
			new Claim(ClaimTypes.Name, user.UserName),
			new Claim(ClaimTypes.NameIdentifier, user.Id)
		}),
				Expires = DateTime.UtcNow.AddDays(7),
				Issuer = _configuration["Jwt:Issuer"],
				Audience = _configuration["Jwt:Audience"],
				SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
			};

			var token = tokenHandler.CreateToken(tokenDescriptor);

			// Log the token and userId for debugging
			Console.WriteLine($"UserId: {user.Id}, Token: {tokenHandler.WriteToken(token)}");

			// Return both the token and userId
			return Ok(new { Token = tokenHandler.WriteToken(token), UserId = user.Id, Username= user.UserName });
		}

		[HttpPost("uploadProfileImage")]
		public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string userId)
		{
			if (file == null || file.Length == 0)
			{
				return BadRequest("No file uploaded.");
			}

			var user = await _userManager.FindByIdAsync(userId);
			if (user == null)
			{
				return NotFound("User not found.");
			}

			var uploadDir = Path.Combine("profileImage", userId);
			if (!Directory.Exists(uploadDir))
			{
				Directory.CreateDirectory(uploadDir);
			}

			var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
			var filePath = Path.Combine(uploadDir, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

			
			user.ProfileImagePath = filePath;
			var result = await _userManager.UpdateAsync(user);

			if (!result.Succeeded)
			{
				return BadRequest("Failed to update user profile image.");
			}

			return Ok(new { Message = "Profile image uploaded successfully", ImagePath = filePath });
		}


	}
}
