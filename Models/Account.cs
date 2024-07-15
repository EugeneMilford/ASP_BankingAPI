using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class Account
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string AccountNumber { get; set; }

        [Required]
        public decimal Balance { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; }

        public string AccountType { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
