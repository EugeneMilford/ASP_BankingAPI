using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class Transaction
    {
        public int Id { get; set; }

        [Required]
        public int AccountId { get; set; }
        public Account Account { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public string Type { get; set; } // "Credit" or "Debit"
        public string Description { get; set; }
    }
}
