using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RunningBackend.Models
{
	public class Challenge
	{
		public int Id { get; set; }
		public string InviterId { get; set; }
		public ApplicationUser Inviter { get; set; }
		public string InviteeId { get; set; }
		public ApplicationUser Invitee { get; set; }
		public string ChallengeType { get; set; } // e.g., "Run 5km together"
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public string Status { get; set; } // "Pending", "Accepted", "Completed", "Failed"
	}

}