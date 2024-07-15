using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class BillPayment
    {
        public int Id { get; set; }

        [Required]
        public int AccountId { get; set; }
        public Account Account { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        public string Biller { get; set; } // e.g., "Electric Company"
        public string ReferenceNumber { get; set; }
    }
}
