using System;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class BillPayment
    {
        [Key]
        public int BillId { get; set; }

        [Required]
        public int AccountId { get; set; }  // Link to Account
        public Account Account { get; set; }  // Navigation property to Account

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        public string Biller { get; set; } // e.g., "Electric Company"
        public string ReferenceNumber { get; set; }

        // Optionally, include a method to process payments and update account balance
        public void ProcessPayment()
        {
            Account.UpdateBalance(-Amount);  // Subtract amount from account balance
        }
    }
}

//using System.ComponentModel.DataAnnotations;

//namespace BankingAPI.Models
//{
//    public class BillPayment
//    {
//        public int Id { get; set; }

//        [Required]
//        public int AccountId { get; set; }
//        public Account Account { get; set; }

//        [Required]
//        public decimal Amount { get; set; }

//        [Required]
//        public DateTime PaymentDate { get; set; }

//        public string Biller { get; set; } // e.g., "Electric Company"
//        public string ReferenceNumber { get; set; }
//    }
//}
