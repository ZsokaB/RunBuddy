using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RunningBackend.Models
{
	public class ChallengeInvitation
	{
		[Key]
		public int Id { get; set; }

		public string InviterId { get; set; }
		public string InviteeId { get; set; }

		[ForeignKey(nameof(InviterId))]
		public ApplicationUser Inviter { get; set; }

		[ForeignKey(nameof(InviteeId))]
		public ApplicationUser Invitee { get; set; }

		public DateTime SentAt { get; set; } 
		public bool IsAccepted { get; set; } = false;
	}
}