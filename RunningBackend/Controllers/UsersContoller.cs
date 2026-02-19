using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RunningBackend.DTOs;
using RunningBackend.Models;
using SixLabors.ImageSharp.Processing;
using System.Security.Claims;
using SixLabors.ImageSharp;
using RunningBackend.Data;

namespace RunningBackend.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class UsersController : ControllerBase
	{
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly ApplicationDbContext _dbContext;

		public UsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext dbContext)
		{
			_userManager = userManager;
			_dbContext = dbContext;
		}

		


		[HttpGet("{id}")]
		public async Task<IActionResult> GetUserById(string id)
		{
			var user = await _userManager.FindByIdAsync(id);
			if (user == null)
				return NotFound(new { Message = "User not found" });

			return Ok(new
			{
				user.Id,
				user.UserName,
				user.Email,
				user.FirstName,
				user.LastName,
				user.Gender,
				user.Weight,
				user.Height,
				user.Birthdate,
				user.ProfileImagePath,
				
			});

		}

		[HttpGet("{userId}/data/{currentUserId1}")]
		public async Task<IActionResult> GetUserByIdWithCounts(string userId, string currentUserId1)
		{
			var userTask = _userManager.FindByIdAsync(userId);
			var followerCountTask = _dbContext.UserConnections
				.CountAsync(connection => connection.FollowedUserId == userId);
			var followingCountTask = _dbContext.UserConnections
				.CountAsync(connection => connection.FollowingUserId == userId);
			var firstRunTask = _dbContext.Runs
				.Where(r => r.UserId == userId)
				.OrderBy(r => r.Date)
				.FirstOrDefaultAsync();

			var followersTask = _dbContext.UserConnections
				.Where(connection => connection.FollowedUserId == userId)
				.Join(_dbContext.Users,
					connection => connection.FollowingUserId,
					user => user.Id,
					(connection, user) => new
					{
						user.Id,
						user.UserName,
						user.FirstName,
						user.LastName,
						user.ProfileImagePath,
					})
				.ToListAsync();

			var followingTask = _dbContext.UserConnections
				.Where(connection => connection.FollowingUserId == userId)
				.Join(_dbContext.Users,
					connection => connection.FollowedUserId,
					user => user.Id,
					(connection, user) => new
					{
						user.Id,
						user.UserName,
						user.FirstName,
						user.LastName,
						user.ProfileImagePath,
					})
				.ToListAsync();

			var monthlyStatsTask = GetMonthlyStats(userId);
			var isFollowingTask = _dbContext.UserConnections
	.AnyAsync(connection => connection.FollowingUserId == currentUserId1 && connection.FollowedUserId == userId);

			await Task.WhenAll(userTask, followerCountTask, followingCountTask, firstRunTask, followersTask, followingTask, monthlyStatsTask,isFollowingTask);

			var user = userTask.Result;
			if (user == null)
				return NotFound(new { Message = "User not found" });

			var followerCount = followerCountTask.Result;
			var followingCount = followingCountTask.Result;
			var firstRun = firstRunTask.Result;
			var followers = followersTask.Result;
			var following = followingTask.Result;
			var monthlyStats = monthlyStatsTask.Result;
			var isFollowing = isFollowingTask.Result;

			return Ok(new
			{
				user.Id,
				user.UserName,
				user.Email,
				user.FirstName,
				user.LastName,
				user.Gender,
				user.Weight,
				user.Height,
				user.Birthdate,
				user.ProfileImagePath,
				FollowerCount = followerCount,
				FollowingCount = followingCount,
				FirstRunDate = firstRun?.Date.Year,
				Followers = followers,
				Following = following,
				MonthlyStats = monthlyStats,
				IsFollowing = isFollowing
			});
		}


		private async Task<object> GetMonthlyStats(string userId)
		{
		
			var now = DateTime.UtcNow;
			var lastMonthDate = now.AddMonths(-1);
			var startOfLastMonth = new DateTime(lastMonthDate.Year, lastMonthDate.Month, 1);
			var endOfLastMonth = startOfLastMonth.AddMonths(1).AddTicks(-1);

			
			var runs = await _dbContext.Runs
				.Where(r => r.UserId == userId && r.Date >= startOfLastMonth && r.Date <= endOfLastMonth)
				.ToListAsync();

			if (runs == null || runs.Count == 0)
				return new { Message = "No runs found for the last month for this user." };

			var totalDistance = runs.Sum(r => r.Distance);
			var totalDurationSeconds = runs.Sum(r => r.Duration.TotalSeconds);
			var runCount = runs.Count;
			var totalDuration = TimeSpan.FromSeconds(totalDurationSeconds);

			
			return new
			{
				Period = "Last Month",
				StartDate = startOfLastMonth,
				EndDate = endOfLastMonth,
				TotalDistance = totalDistance,
				TotalDuration = totalDuration.ToString(@"hh\:mm\:ss"),
				RunCount = runCount,
			};
		}


		[HttpGet("search")]
		public async Task<IActionResult> SearchUsers([FromQuery] string query)
		{
			if (string.IsNullOrEmpty(query))
				return BadRequest(new { Message = "Query cannot be empty" });

			
			var users = await _userManager.Users
				.Where(u => u.UserName.Contains(query) ||
							(u.FirstName != null && u.FirstName.Contains(query)) ||
							(u.LastName != null && u.LastName.Contains(query)))
				.Select(u => new
				{
					u.Id,
					u.UserName,
					u.FirstName,
					u.LastName,
					u.Email,
					u.ProfileImagePath
				})
				.ToListAsync(); // Use ToListAsync for async execution

			// After fetching users, include profile images
			var usersWithImages = users.Select(u => new
			{
				u.Id,
				u.UserName,
				u.FirstName,
				u.LastName,
				u.Email,
				u.ProfileImagePath
			}).ToList();

			return Ok(usersWithImages);
		}

		[Authorize]
		[HttpPut("update")]
		public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto model)
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (userId == null)
				return Unauthorized();

			var user = await _userManager.FindByIdAsync(userId);
			if (user == null)
				return NotFound("User not found");

			// Update personal details
			user.FirstName = model.FirstName;
			user.LastName = model.LastName;
			user.Gender = model.Gender;
			user.Weight = model.Weight;
			user.Height = model.Height;
			user.Birthdate = model.Birthdate;

			// Update username
			if (!string.IsNullOrEmpty(model.Username) && user.UserName != model.Username)
			{
				var existingUser = await _userManager.FindByNameAsync(model.Username);
				if (existingUser != null)
					return BadRequest("Username already taken");

				user.UserName = model.Username;
			}

			
			if (!string.IsNullOrEmpty(model.Email) && user.Email != model.Email)
			{
				var existingEmailUser = await _userManager.FindByEmailAsync(model.Email);
				if (existingEmailUser != null)
					return BadRequest("Email already in use");

				var setEmailResult = await _userManager.SetEmailAsync(user, model.Email);
				if (!setEmailResult.Succeeded)
					return BadRequest(setEmailResult.Errors);
			}

			if (!string.IsNullOrEmpty(model.NewPassword) && !string.IsNullOrEmpty(model.CurrentPassword))
			{
				var passwordCheck = await _userManager.CheckPasswordAsync(user, model.CurrentPassword);
				if (!passwordCheck)
					return BadRequest("Current password is incorrect");

				var changePasswordResult = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
				if (!changePasswordResult.Succeeded)
					return BadRequest(changePasswordResult.Errors);
			}

			var updateResult = await _userManager.UpdateAsync(user);
			if (!updateResult.Succeeded)
				return BadRequest(updateResult.Errors);

			return Ok(new { Message = "User updated successfully", UserId = userId  });
			
		}

		[HttpGet("StreamProfileImage/{userId}")]
		public FileContentResult StreamProfileImage(string userId)
		{
			string path = $"profileImage/{userId}";

			if (Directory.Exists(path))
			{
				var file = Directory.GetFiles(path).FirstOrDefault();

				if (file != null)
				{
					byte[] bytes = System.IO.File.ReadAllBytes(file);
					return File(bytes, "image/jpeg");
				}
			}

			return null;
		}
		[HttpPost("updateProfileImage")]
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

			var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "profileImage", userId);
			if (!Directory.Exists(uploadDir))
			{
				Directory.CreateDirectory(uploadDir);
			}

			
			if (!string.IsNullOrEmpty(user.ProfileImagePath))
			{
				var existingFilePath = Path.Combine(Directory.GetCurrentDirectory(), user.ProfileImagePath);
				if (System.IO.File.Exists(existingFilePath))
				{
					System.IO.File.Delete(existingFilePath);
				}
			}

			var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
			var filePath = Path.Combine(uploadDir, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

		
			user.ProfileImagePath = Path.Combine("profileImage", userId, fileName);
			var result = await _userManager.UpdateAsync(user);

			if (!result.Succeeded)
			{
				return BadRequest("Failed to update user profile image.");
			}

			return Ok(new { Message = "Profile image uploaded successfully", ImagePath = user.ProfileImagePath });
		}

	}
}
