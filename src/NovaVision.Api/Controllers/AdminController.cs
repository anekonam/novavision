using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaVision.Infrastructure.Data;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly NovaVisionDbContext _db;

    public AdminController(NovaVisionDbContext db) => _db = db;

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers()
    {
        var users = await _db.Users
            .OrderBy(u => u.Role).ThenBy(u => u.LastName)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString(),
                u.IsEnabled,
                u.LastLoginAt,
                u.CreatedAt,
            })
            .ToListAsync();

        return Ok(users);
    }
}
