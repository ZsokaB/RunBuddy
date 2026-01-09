using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunningBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordinatesToRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Longtitude",
                table: "Coordinates",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "Lattitude",
                table: "Coordinates",
                newName: "Latitude");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "Coordinates",
                newName: "Longtitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "Coordinates",
                newName: "Lattitude");
        }
    }
}
