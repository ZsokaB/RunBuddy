using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RunningBackend.Data;
using RunningBackend.Models;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class UserConnectionsController : ControllerBase
{
	private readonly ApplicationDbContext _dbContext;

	public UserConnectionsController(ApplicationDbContext dbContext)
	{
		_dbContext = dbContext;
	}

	[HttpPost("follow")]
	public async Task<IActionResult> FollowUser([FromBody] UserConnection userConnection)
	{
		if (userConnection.FollowingUserId == userConnection.FollowedUserId)
		{
			return BadRequest(new
			{
				Message = "You cannot follow yourself.",
				FollowerId = userConnection.FollowingUserId,
				FolloweeId = userConnection.FollowedUserId
			});
		}

		if (string.IsNullOrEmpty(userConnection.FollowingUserId) || string.IsNullOrEmpty(userConnection.FollowedUserId))
		{
			return BadRequest(new
			{
				Message = "Both FollowingUserId and FollowedUserId must be provided.",
				FollowerId = userConnection.FollowingUserId,
				FolloweeId = userConnection.FollowedUserId
			});
		}

		var existingConnection = await _dbContext.UserConnections
			.FirstOrDefaultAsync(uc => uc.FollowingUserId == userConnection.FollowingUserId &&
										uc.FollowedUserId == userConnection.FollowedUserId);

		if (existingConnection != null)
		{
			return BadRequest(new
			{
				Message = "You are already following this user.",
				FollowerId = userConnection.FollowingUserId,
				FolloweeId = userConnection.FollowedUserId
			});
		}

		userConnection.ConnectedOn = DateTime.UtcNow;
		_dbContext.UserConnections.Add(userConnection);
		await _dbContext.SaveChangesAsync();

		return Ok();
	}



	[HttpDelete("unfollow")]
	public async Task<IActionResult> UnfollowUser([FromQuery] string followerUserId, [FromQuery] string userToUnfollowId)
	{
		var existingConnection = await _dbContext.UserConnections
			.FirstOrDefaultAsync(connection =>
				connection.FollowingUserId == followerUserId &&
				connection.FollowedUserId == userToUnfollowId);

		if (existingConnection == null)
		{
			return NotFound("You are not following this user.");
		}

		_dbContext.UserConnections.Remove(existingConnection);
		await _dbContext.SaveChangesAsync();

		return Ok("User unfollowed successfully.");
	}

	
	[HttpGet("{userId}/followers/count")]
	public async Task<IActionResult> GetFollowerCount(string userId)
	{
		var followerCount = await _dbContext.UserConnections
			.CountAsync(connection => connection.FollowedUserId == userId);

		return Ok(new { UserId = userId, FollowerCount = followerCount });
	}

	[HttpGet("{userId}/following/count")]
	public async Task<IActionResult> GetFollowingCount(string userId)
	{
		var followingCount = await _dbContext.UserConnections
			.CountAsync(connection => connection.FollowingUserId == userId);

		return Ok(new { UserId = userId, FollowingCount = followingCount });
	}

	
	[HttpGet("{userId}/followers")]
	public async Task<IActionResult> GetFollowers(string userId)
	{
		var followers = await _dbContext.UserConnections
			.Where(connection => connection.FollowedUserId == userId)
			.Join(_dbContext.Users,
				connection => connection.FollowingUserId,
				user => user.Id,
				(connection, user) => new
				{
					user.Id,
					user.UserName,
				})
			.ToListAsync();

		return Ok(followers);
	}
	[HttpGet("{userId}/following")]
	public async Task<IActionResult> GetFollowing(string userId)
	{
		var following = await _dbContext.UserConnections
			.Where(connection => connection.FollowingUserId == userId)
			.Join(_dbContext.Users,
				connection => connection.FollowedUserId,
				user => user.Id,
				(connection, user) => new
				{
					user.Id,
					user.UserName,
					user.Email
				})
			.ToListAsync();

		return Ok(following);
	}


}
