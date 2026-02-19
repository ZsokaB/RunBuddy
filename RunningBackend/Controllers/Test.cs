using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
[AllowAnonymous]
public class TestController : ControllerBase
{
	[HttpGet("data")]
	public IActionResult GetProtectedData()
	{
		return Ok(new { Message = "This is protected data!" });
	}
}