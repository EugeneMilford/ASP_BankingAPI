using System;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class Loan
    {
        [Key]
        public int LoanId { get; set; }

        [Required]
        public int AccountId { get; set; }
        public Account Account { get; set; }

        [Required]
        public decimal LoanAmount { get; set; }

        [Required]
        public decimal InterestRate { get; set; }

        [Required]
        public DateTime LoanStartDate { get; set; }

        [Required]
        public DateTime LoanEndDate { get; set; }

        [Required]
        public decimal RemainingAmount { get; set; }

        public bool IsLoanPaidOff { get; set; }

        // Method to calculate monthly repayment
        public decimal CalculateMonthlyRepayment()
        {
            int months = (LoanEndDate.Year - LoanStartDate.Year) * 12 + LoanEndDate.Month - LoanStartDate.Month;
            decimal monthlyRepayment = (LoanAmount + (LoanAmount * InterestRate / 100)) / months;
            return monthlyRepayment;
        }
    }
}
