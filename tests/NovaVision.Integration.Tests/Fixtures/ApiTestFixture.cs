using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NovaVision.Infrastructure.Data;
using Testcontainers.MsSql;

namespace NovaVision.Integration.Tests.Fixtures;

public class ApiTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _sqlContainer = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    public async Task InitializeAsync()
    {
        await _sqlContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _sqlContainer.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<NovaVisionDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add DbContext with Testcontainers SQL Server
            services.AddDbContext<NovaVisionDbContext>(options =>
                options.UseSqlServer(_sqlContainer.GetConnectionString()));
        });

        builder.UseEnvironment("Development");
    }
}
