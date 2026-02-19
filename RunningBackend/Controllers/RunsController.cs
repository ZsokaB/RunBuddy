using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using RunningBackend.Data;
using RunningBackend.Models;
using RunningBackend.DTOs;
using SixLabors.ImageSharp;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RunsController : ControllerBase
{
	private readonly ApplicationDbContext _context;
	private readonly UserManager<ApplicationUser> _userManager;

	#region Endpoints
	public RunsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
	{
		_context = context;
		_userManager = userManager;
	}

	[HttpPost("uploadImage")]
	public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] int runId)
	{
		long size = file.Length;
		if (file == null || size == 0) { return Ok(); }

		var tmpGuid = Guid.NewGuid();

		if (!Directory.Exists($"upload/{runId}"))
		{
			Directory.CreateDirectory($"upload/{runId}");
		}

		var filePath = $"upload/{runId}/{file.FileName}";

		using (var stream = System.IO.File.Create(filePath))
		{
			file.CopyTo(stream);
		}

		var runToUpdate = _context.Runs.FirstOrDefault(x => x.Id == runId);

		if (runToUpdate != null)
		{
			runToUpdate.Image = filePath;
		}

		await _context.SaveChangesAsync();

		return Ok();
	}

	[HttpPost("save")]
	public async Task<IActionResult> SaveRun([FromBody] RunDto runDto)
	{

		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var run = new Run
		{
			UserId = userId,
			Distance = runDto.Distance,
			Duration = runDto.Duration,
			Pace = runDto.Pace,
			Date = runDto.Date,
			KilometerPaces = runDto.KilometerPaces,
			Calories = runDto.Calories,
			Rating = runDto.Rating,
			Image = null,
			Note = runDto.Note,
			Type = runDto.Type,
		};

		foreach (var coord in runDto.Coordinates)
		{
			run.Coordinates.Add(new Coordinate
			{
				Latitude = coord.Latitude,
				Longitude = coord.Longitude,
				
			});
		}
	

		_context.Runs.Add(run);

		await _context.SaveChangesAsync();
		return Ok(new { Message = "Run saved successfully", RunId = run.Id });
	}

	[HttpPut("update/{id}")]
	public async Task<IActionResult> UpdateRun(int id, [FromBody] RunUpdateDto runUpdateDto)
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var run = await _context.Runs
			.Include(r => r.Coordinates)
			.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

		if (run == null)
		{
			return NotFound(new { Message = "Run not found" });
		}

		
		run.Rating = runUpdateDto.Rating;
		run.Note = runUpdateDto.Note;

		_context.Runs.Update(run);
		await _context.SaveChangesAsync();

		return Ok(new { Message = "Run updated successfully" });
	}
	[HttpDelete("delete/{id}")]
	public async Task<IActionResult> DeleteRun(int id)
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var run = await _context.Runs
			.Include(r => r.Coordinates)
			.Include(r=> r.KilometerPaces)
			.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

		if (run == null)
		{
			return NotFound(new { Message = "Run not found" });
		}

		_context.Coordinates.RemoveRange(run.Coordinates); // Remove related coordinates first
		_context.Runs.Remove(run);
		await _context.SaveChangesAsync();

		return Ok(new { Message = "Run deleted successfully" });
	}

	[HttpGet("getRunProgress")]
	public IActionResult GetRunProgress()
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var runs = _context.Runs
			.Where(r => r.UserId == userId && !r.Type.Contains("Free Run"))
			.Select(r => new
			{
				RunId = r.Id,	
				RunType = r.Type,
				RunDate = r.Date,
				RunDistance = r.Distance,
				RunPace = r.Pace,


			})
			.ToList(); 

		var processedRuns = runs.Select(r => new
		{
				
			Week = ExtractWeek(r.RunType),  
			Day = ExtractDay(r.RunType),
			RunDate = r.RunDate,
			RunDistance = r.RunDistance,
			RunPace = r.RunPace,
			RunId = r.RunId,
			
		}).ToList();

		return Ok(processedRuns);
	}

	
	[HttpGet("getNextRun")]
	public IActionResult GetNextRun()
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var runs = _context.Runs
			.Where(r => r.UserId == userId && !r.Type.Contains("Free Run"))
			.ToList(); 

		var completedRuns = runs
			.Select(r => new
			{
				Week = ExtractWeek(r.Type),
				Day = ExtractDay(r.Type)
			})
			.OrderBy(r => r.Week)
			.ThenBy(r => r.Day)
			.ToList();

		int maxWeek = completedRuns.Any() ? completedRuns.Max(r => r.Week) : 0;
		int maxDay = completedRuns.Any(r => r.Week == maxWeek) ? completedRuns.Where(r => r.Week == maxWeek).Max(r => r.Day) : 0;

		if (maxWeek == 0 && maxDay == 0)
		{
			return Ok(new { Week = 1, Day = 1 });
		}

		int nextDay = maxDay + 1;
		int nextWeek = maxWeek;
		if (nextDay > 3) 
		{
			nextDay = 1;
			nextWeek++;
		}

		

		return Ok(new { Week = nextWeek, Day = nextDay });
	}

	[HttpPost("saveRunProgress")]
	public async Task<IActionResult> SaveRunProgress([FromBody] UserTrainingProgressDto trainingProgressDto)
	{

		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		var progress = new UserTrainingProgress
		{
			UserId = userId,
		    TrainingWeek = trainingProgressDto.TrainingWeek,
	        TrainingDay = trainingProgressDto.TrainingDay,
	        CompletionDate = DateTime.Now,

};

		_context.UserTrainingProgresses.Add(progress);

		await _context.SaveChangesAsync();
		return Ok();
	}

	[HttpPost("saveRunWithProgress")]
	public async Task<IActionResult> SaveRunWithProgress([FromBody] SaveRunWithProgressDto saveDto)
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

		// Create Run entity
		var run = new Run
		{
			UserId = userId,
			Distance = saveDto.Distance,
			Duration = saveDto.Duration,
			Pace = saveDto.Pace,
			Date = saveDto.Date,
			
			Calories = saveDto.Calories,
			Rating = saveDto.Rating,
			Image = null,
			Note = saveDto.Note,
			Type = saveDto.Type,
			Coordinates = saveDto.Coordinates.Select(coord => new Coordinate
			{
				Latitude = coord.Latitude,
				Longitude = coord.Longitude
			}).ToList()
		};

		var progress = new UserTrainingProgress
		{
			UserId = userId,
			TrainingWeek = saveDto.TrainingWeek,
			TrainingDay = saveDto.TrainingDay,
			CompletionDate = DateTime.Now
		};

		_context.Runs.Add(run);
		_context.UserTrainingProgresses.Add(progress);

		await _context.SaveChangesAsync();

		return Ok(new { Message = "Run and Progress saved successfully", RunId = run.Id });
	}

	[HttpGet("{id}")]
	public IActionResult GetRunById(int id, [FromQuery] bool lowQuality = false)
	{
		var run = _context.Runs
			.Include(r => r.Coordinates)
			.Include(r=> r.KilometerPaces)
	.FirstOrDefault(r => r.Id == id);

		if (run == null)
		{
			return NotFound();
		}

		return Ok(new
		{
			run.Id,
			run.Distance,
			run.Duration,
			run.Pace,
			run.Date,
			run.Calories,
			run.Type,
			run.Coordinates,
			run.Note,
			run.Rating,
			run.Image,
			run.KilometerPaces,
			
		});
	}

	[HttpGet("recent")]
	public async Task<IActionResult> GetRecentRuns([FromQuery] bool lowQuality = false, int page = 1, int limit = 10)
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userId == null)
		{
			return Unauthorized();
		}

		var recordsToSkipCount = (page - 1) * limit;
		var recentRunsBaseQuery = _context.Runs
			.Where(run => run.UserId == userId)
			.OrderByDescending(run => run.Date);

		var recentRuns = recentRunsBaseQuery
			.Skip(recordsToSkipCount)
			.Take(limit)
			.Select(run => new
			{
				run.Id,
				run.Distance,
				run.Duration,
				run.Pace,
				run.Date,
				run.Type,
				run.Image,

			})
			.ToList();
		var recentRunsWithImgs = recentRuns.Select(run => new
		{
			run.Id,
			run.Distance,
			run.Duration,
			run.Pace,
			run.Date,
			run.Type,
			run.Image,
		});

		var count = recentRunsBaseQuery.Count();

		var output = new { recentRunsWithImgs, count };

		return Ok(output);
	}

	[HttpGet("StreamImageForRun/{runId}")]
	public FileContentResult? StreamImageForRun(int runId)
	{
		string path = $"upload/{runId}";

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

	private (DateTime StartOfWeek, DateTime EndOfWeek) GetCurrentWeekRange()
	{
		var today = DateTime.UtcNow.Date; 
		int daysSinceMonday = (int)today.DayOfWeek - (int)DayOfWeek.Monday;
		daysSinceMonday = daysSinceMonday < 0 ? 6 : daysSinceMonday; 

		var startOfWeek = today.AddDays(-daysSinceMonday);
		var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1); 

		return (startOfWeek, endOfWeek);
	}
	[HttpGet("weeklyStats")]
	public async Task<IActionResult> GetWeeklyStats()
	{
		
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userId == null)
		{
			return Unauthorized(); 
		}

		var user = await _context.Users
			.Where(u => u.Id == userId)
			.Select(u => new { u.Id, u.FirstName, u.ProfileImagePath})
			.FirstOrDefaultAsync();

		if (user == null)
		{
			return NotFound("User not found.");
		}

		var (startOfWeek, endOfWeek) = GetCurrentWeekRange();

		var runs = await _context.Runs
			.Where(r => r.UserId == userId && r.Date >= startOfWeek && r.Date <= endOfWeek)
			.ToListAsync(); 

		var totalDuration = TimeSpan.FromSeconds(runs.Sum(r => r.Duration.TotalSeconds));
		var totalDistance = runs.Sum(r => r.Distance);

		var weeklyStats = new
		{
			UserId = user.Id,
			Name = user.FirstName,
			ProfileImagePath = user.ProfileImagePath,
			Runs = runs.Count,
			TotalDuration = totalDuration.ToString(@"hh\:mm\:ss"),
			TotalDistance = totalDistance
		};

		return Ok(weeklyStats);
	}

	[HttpGet("followed/recent")]
	public async Task<IActionResult> GetRecentRunsOfFollowedUsers()
	{
		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userId == null)
		{
			return Unauthorized();
		}

		
		var followedUserIds = await _context.UserConnections
			.Where(uc => uc.FollowingUserId == userId)
			.Select(uc => uc.FollowedUserId)
			.ToListAsync();

		if (!followedUserIds.Any())
		{
			return Ok(new { Message = "You are not following anyone yet." });
		}

		
		var recentRuns = await _context.Runs
			.Where(run => followedUserIds.Contains(run.UserId))
			.OrderByDescending(run => run.Date)
			.Include(run => run.Coordinates)
			.Include(run => run.Comments)
			.Include(run => run.Likes)
			.Include(run => run.User)
			.Take(10)
			.ToListAsync();

		var runsWithImages = recentRuns.Select(run => new
		{
			run.Id,
			run.UserId,
			run.Distance,
			run.Duration,
			run.Pace,
			run.Date,
			run.Image,
			run.Note,
			run.Calories,
			run.Type,
			Coordinates = run.Coordinates.Select(c => new { c.Latitude, c.Longitude }),
			Username = run.User?.UserName,
			run.User?.ProfileImagePath,
			CommentsCount = run.Comments.Count(),
			LikesCount = run.Likes.Count(),
			LikedByMe = run.Likes.Any(x => x.UserId == userId)
		}).ToList();

		return Ok(runsWithImages);
	}

	[HttpGet("getstats")]
	public async Task<IActionResult> GetStats([FromQuery] string period, [FromQuery] DateTime referenceDate)
	{
		DateTime startDate, endDate;

		switch (period.ToLower())
		{
			case "week":
				(startDate, endDate) = GetWeekRange(referenceDate);
				break;
			case "month":
				(startDate, endDate) = GetMonthRange(referenceDate);
				break;
			case "year":
				(startDate, endDate) = GetYearRange(referenceDate);
				break;
			default:
				return BadRequest("Invalid period specified. Use 'week', 'month', or 'year'.");
		}

		var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
		if (userId == null)
		{
			return Unauthorized(); 
		}

		var runs = await _context.Runs
			.Where(r => r.UserId == userId && r.Date >= startDate && r.Date <= endDate)
			.ToListAsync(); 

		if (runs == null || runs.Count == 0)
		{
			return Ok(0);
		}

		var totalDistance = runs.Sum(r => r.Distance);
		var totalCalories = runs.Sum(r => r.Calories);
		var totalDurationSeconds = runs.Sum(r => r.Duration.TotalSeconds);
		var runCount = runs.Count();

		var avgPace = totalDistance > 0 ? totalDurationSeconds / (totalDistance / 1000)  : 0;

		var totalDuration = TimeSpan.FromSeconds(totalDurationSeconds);

		var avgPaceMinutes = TimeSpan.FromSeconds(avgPace); 
		var avgPaceFormatted = avgPaceMinutes.ToString(@"mm\:ss");

		
		var result = new
		{
			Period = period,
			StartDate = startDate,
			EndDate = endDate,
			TotalDistance = totalDistance,
			TotalDuration = totalDuration.ToString(@"hh\:mm\:ss"),
			TotalCalories = totalCalories,
			RunCount = runCount,
			AvgPace = avgPaceFormatted
		};

		return Ok(result);
	}

	[Authorize]
	[HttpPost("{id}/like")]
	public async Task<IActionResult> LikeRun(int id)
	{
		var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (userId == null) return Unauthorized();

		var run = await _context.Runs.FindAsync(id);
		if (run == null) return NotFound();

		var like = await _context.Likes.FirstOrDefaultAsync(l => l.RunId == id && l.UserId == userId);

		if (like != null)
		{
			_context.Likes.Remove(like); 
		}
		else
		{
			_context.Likes.Add(new Like { RunId = id, UserId = userId });
		}

		await _context.SaveChangesAsync();

		var likeCount = await _context.Likes.CountAsync(l => l.RunId == id);
		return Ok(new { likeCount });
	}

	[HttpGet("{id}/likes")]
	public async Task<IActionResult> GetLikes(int id)
	{
		var likeCount = await _context.Likes.CountAsync(l => l.RunId == id);
		return Ok(new { likeCount });
	}

	[HttpGet("/{userId}/runs-with-likes")]
	public async Task<IActionResult> GetUserRunsWithLikes(string userId)
	{
		var runsWithLikes = await _context.Runs
			.Where(r => r.UserId == userId)
			.Select(r => new
			{
				RunId = r.Id,
				Likes = _context.Likes.Count(l => l.RunId == r.Id)
			})
			.ToListAsync();

		return Ok(runsWithLikes);
	}

	[Authorize]
	[HttpPost("{id}/comments")]
	public async Task<IActionResult> AddComment(int id, [FromBody] CommentDto commentDto)
	{
		var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (userId == null) return Unauthorized();

		var run = await _context.Runs.FindAsync(id);
		if (run == null) return NotFound();

		var comment = new Comment
		{
			RunId = id,
			UserId = userId,
			Text = commentDto.Text,
			CreatedAt = DateTime.UtcNow
		};

		_context.Comments.Add(comment);
		await _context.SaveChangesAsync();

		return Ok(comment);
	}

	[HttpGet("{id}/comments")]
	public async Task<IActionResult> GetComments(int id)
	{
		var comments = await _context.Comments
			.Where(c => c.RunId == id)
			.OrderBy(c => c.CreatedAt)
			.Select(c => new
			{
				c.Id,
				c.RunId,
				c.Text,
				c.CreatedAt,
				UserName = _context.Users.Where(u => u.Id == c.UserId).Select(u => u.UserName).FirstOrDefault(),
			})
			.ToListAsync();

		return Ok(comments);
	}

	[HttpGet("userRuns/{userId}")]
	public async Task<IActionResult> GetRunsByUserId(string userId, [FromQuery] int page = 1, [FromQuery] int limit = 5)
	{
		if (string.IsNullOrEmpty(userId))
		{
			return BadRequest("User ID cannot be empty.");
		}

		var recordsToSkipCount = (page - 1) * limit;

		var userRunsBaseQuery = _context.Runs
			.Where(run => run.UserId == userId)
			.OrderByDescending(run => run.Date)
			.Include(run => run.Coordinates)
			.Include(run => run.Comments)
		    .Include(run => run.Likes)
		    .Include(run => run.User);

		var userRuns = await userRunsBaseQuery
			.Skip(recordsToSkipCount)
			.Take(limit)
			.Select(run => new
			{
				run.Id,
				run.Distance,
				run.Duration,
				run.Pace,
				run.Date,
				run.Note,
				run.Calories,
				run.Type,
				run.Image,
				Coordinates = run.Coordinates.Select(c => new { c.Latitude, c.Longitude }),
				run.UserId,
				CommentsCount = run.Comments.Count(),
				LikesCount = run.Likes.Count(),
				LikedByMe = run.Likes.Any(x => x.UserId == userId)
			    }).ToListAsync();

		var totalCount = await userRunsBaseQuery.CountAsync();

		return Ok(new { Runs = userRuns, TotalCount = totalCount });
	}



	#endregion

	#region Private helpers
	private int ExtractWeek(string runType)
	{
		var weekMatch = Regex.Match(runType, @"Week (\d+)");
		return weekMatch.Success ? int.Parse(weekMatch.Groups[1].Value) : 0;
	}

	private int ExtractDay(string runType)
	{
		var dayMatch = Regex.Match(runType, @"Day (\d+)");
		return dayMatch.Success ? int.Parse(dayMatch.Groups[1].Value) : 0;
	}

	private (DateTime Start, DateTime End) GetWeekRange(DateTime referenceDate)
	{
		int daysSinceMonday = (int)referenceDate.DayOfWeek - (int)DayOfWeek.Monday;
		daysSinceMonday = daysSinceMonday < 0 ? 6 : daysSinceMonday;
		var startOfWeek = referenceDate.Date.AddDays(-daysSinceMonday);
		var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1);
		return (startOfWeek, endOfWeek);
	}

	private (DateTime Start, DateTime End) GetMonthRange(DateTime referenceDate)
	{
		var startOfMonth = new DateTime(referenceDate.Year, referenceDate.Month, 1);
		var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);
		return (startOfMonth, endOfMonth);
	}

	private (DateTime Start, DateTime End) GetYearRange(DateTime referenceDate)
	{
		var startOfYear = new DateTime(referenceDate.Year, 1, 1);
		var endOfYear = startOfYear.AddYears(1).AddTicks(-1);
		return (startOfYear, endOfYear);
	}
	#endregion
}