using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunningBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordinatesToRun2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Coordinates_Runs_RunId",
                table: "Coordinates");

            migrationBuilder.AlterColumn<int>(
                name: "RunId",
                table: "Coordinates",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Coordinates_Runs_RunId",
                table: "Coordinates",
                column: "RunId",
                principalTable: "Runs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Coordinates_Runs_RunId",
                table: "Coordinates");

            migrationBuilder.AlterColumn<int>(
                name: "RunId",
                table: "Coordinates",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_Coordinates_Runs_RunId",
                table: "Coordinates",
                column: "RunId",
                principalTable: "Runs",
                principalColumn: "Id");
        }
    }
}
