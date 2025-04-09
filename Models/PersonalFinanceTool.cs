using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class PersonalFinanceTool
    {
        [Key]
        public int PersonalId { get; set; }

        [Required]
        public int AccountId { get; set; }
        public Account Account { get; set; }

        public decimal Budget { get; set; }

        public decimal Expenses { get; set; }

        // Method to calculate remaining budget
        public decimal RemainingBudget()
        {
            return Budget - Expenses;
        }
    }
}
