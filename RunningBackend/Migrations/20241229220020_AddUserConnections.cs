using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RunningBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FollowingUserId = table.Column<string>(type: "TEXT", nullable: true),
                    FollowedUserId = table.Column<string>(type: "TEXT", nullable: true),
                    ConnectedOn = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserConnections_AspNetUsers_FollowedUserId",
                        column: x => x.FollowedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserConnections_AspNetUsers_FollowingUserId",
                        column: x => x.FollowingUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserConnections_FollowedUserId",
                table: "UserConnections",
                column: "FollowedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserConnections_FollowingUserId_FollowedUserId",
                table: "UserConnections",
                columns: new[] { "FollowingUserId", "FollowedUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserConnections");
        }
    }
}
