using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
[Authorize]  // This ensures that only authenticated users can access this endpoint
public class TestController : ControllerBase
{
	[HttpGet("data")]
	public IActionResult GetProtectedData()
	{
		return Ok(new { Message = "This is protected data!" });
	}
}