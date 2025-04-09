using System;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class SupportTicket
    {
        [Key]
        public int SupportId { get; set; }

        [Required]
        public int AccountId { get; set; }
        public Account Account { get; set; }

        [Required]
        public string IssueDescription { get; set; }

        public string Resolution { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; }

        public bool IsResolved { get; set; }

        // Method to resolve the ticket
        public void ResolveTicket(string resolution)
        {
            Resolution = resolution;
            IsResolved = true;
        }
    }
}