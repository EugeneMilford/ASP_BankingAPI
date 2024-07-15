using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class CreditCard
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(16)]
        public string CardNumber { get; set; }

        [Required]
        public decimal CreditLimit { get; set; }

        [Required]
        public decimal CurrentBalance { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; }

        public DateTime ExpiryDate { get; set; }
        public string CardType { get; set; } // e.g., "Visa", "MasterCard"
    }
}
