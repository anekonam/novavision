using Microsoft.AspNetCore.Mvc;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Status = "Running",
            Version = "0.1.0",
            Timestamp = DateTime.UtcNow
        });
    }
}
