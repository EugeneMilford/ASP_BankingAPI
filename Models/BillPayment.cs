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

        public string Biller { get; set; } 
        public string ReferenceNumber { get; set; }

        public void ProcessPayment()
        {
            Account.UpdateBalance(-Amount);  // Subtract amount from account balance
        }
    }
}