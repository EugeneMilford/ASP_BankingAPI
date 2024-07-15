using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class Beneficiary
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        [Required]
        [MaxLength(20)]
        public string AccountNumber { get; set; }

        [Required]
        [MaxLength(50)]
        public string BankName { get; set; }

        public string Nickname { get; set; }
    }
}
