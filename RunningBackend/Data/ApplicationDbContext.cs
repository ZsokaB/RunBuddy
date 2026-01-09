using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RunningBackend.Models;

namespace RunningBackend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Run> Runs { get; set; }
        public DbSet<KilometerPace> KilometerPaces { get; set; }
        public DbSet<Coordinate> Coordinates { get; set; }
		public DbSet<UserConnection> UserConnections { get; set; }
		public DbSet<Like> Likes { get; set; }
		public DbSet<Comment> Comments { get; set; }
		public DbSet<UserTrainingProgress> UserTrainingProgresses { get; set; }
		public DbSet<ChallengeInvitation> ChallengeInvitations { get; set; }
		public DbSet<Challenge> Challenges { get; set; }


		protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            
            modelBuilder.Entity<Run>()
                .HasOne(r => r.User)
                .WithMany() 
                .HasForeignKey(r => r.UserId);

			modelBuilder.Entity<Run>()
		   .HasMany(r => r.Coordinates)
		   .WithOne(c => c.Run)
		   .HasForeignKey(c => c.RunId);

			// Configure UserConnection entity
			modelBuilder.Entity<UserConnection>()
				.HasKey(uc => uc.Id);

			modelBuilder.Entity<UserConnection>()
				.HasOne(uc => uc.FollowingUser)
				.WithMany()
				.HasForeignKey(uc => uc.FollowingUserId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<UserConnection>()
				.HasOne(uc => uc.FollowedUser)
				.WithMany()
				.HasForeignKey(uc => uc.FollowedUserId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<UserConnection>()
				.HasIndex(uc => new { uc.FollowingUserId, uc.FollowedUserId })
		.IsUnique();

			modelBuilder.Entity<UserTrainingProgress>()
		   .HasIndex(p => new { p.UserId, p.TrainingWeek, p.TrainingDay }) 
		   .IsUnique();

			modelBuilder.Entity<UserTrainingProgress>()
				.HasOne(p => p.User)
				.WithMany()
				.HasForeignKey(p => p.UserId)
				.OnDelete(DeleteBehavior.Cascade);

			   // ChallengeInvitation relationships
            modelBuilder.Entity<ChallengeInvitation>()
                .HasKey(ci => ci.Id);

            modelBuilder.Entity<ChallengeInvitation>()
                .HasOne(ci => ci.Inviter)
                .WithMany()
                .HasForeignKey(ci => ci.InviterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChallengeInvitation>()
                .HasOne(ci => ci.Invitee)
                .WithMany()
                .HasForeignKey(ci => ci.InviteeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Challenge relationships
            modelBuilder.Entity<Challenge>()
                .HasKey(c => c.Id);

            modelBuilder.Entity<Challenge>()
                .HasOne(c => c.Inviter)
                .WithMany()
                .HasForeignKey(c => c.InviterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Challenge>()
                .HasOne(c => c.Invitee)
                .WithMany()
                .HasForeignKey(c => c.InviteeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
		}

    

