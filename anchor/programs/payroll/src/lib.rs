#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("3eU2jCNmr9JJQUdJa2KJVZLsnYxjnKpPZgkvdFmveXKK");

#[program]
pub mod payroll {
    use anchor_lang::solana_program::{program::invoke, system_instruction};

    use super::*;

    pub fn initialize_payroll(ctx: Context<InitializeSolanaPayroll>, title: String) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        payroll.admin = ctx.accounts.admin.key();
        payroll.title = title;
        Ok(())
    }

    pub fn add_employee(ctx: Context<AddEmployee>, _title: String, salary: u64, name: String) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;

        // Ensure that the admin is removing the employee
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        payroll.id_counter += 1;
        let employee_id = payroll.id_counter;
        let employee = Employee {
            salary,
            pubkey: *ctx.accounts.employee.key,
            name,
            employee_id,
        };

        payroll.employees.push(employee);

        Ok(())
    }

    pub fn remove_employee(ctx: Context<RemoveEmployee>, _title: String, employee_id: u64) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;

        // Ensure that the admin is removing the employee
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        // Find the index of the employee to be removed
        let index = payroll
            .employees
            .iter()
            .position(|employee| employee.employee_id == employee_id);
        if let Some(index) = index {
            // Remove the employee from the vector
            payroll.employees.remove(index);
            Ok(())
        } else {
            Err(ProgramError::InvalidArgument.into())
        }
    }

    pub fn update_salary(
        ctx: Context<UpdateSalary>,
        employee_id: u64,
        new_salary: u64,
        _title: String,
    ) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;

        // Ensure that the admin is removing the employee
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        // Find the index of the employee to be removed
        if let Some(employee) = payroll
            .employees
            .iter_mut()
            .find(|employee| employee.employee_id == employee_id)
        {
            employee.salary = new_salary;
            Ok(())
        } else {
            Err(ProgramError::InvalidArgument.into())
        }
    }

    pub fn process_payroll(ctx: Context<ProcessPayroll>) -> Result<()> {
      let admin_key = ctx.accounts.admin.key();
      let payroll_account_info = ctx.accounts.payroll_account.to_account_info();
      let employee_account_info = ctx.accounts.employee.clone();
      let system_program = ctx.accounts.system_program.to_account_info();
  
      // Ensure that the admin is processing the payroll
      if *payroll_account_info.owner != admin_key {
          return Err(ProgramError::IllegalOwner.into());
      }
  
      // Find the employee in the payroll account
      let employee = ctx.accounts.payroll_account.employees.iter()
          .find(|e| e.pubkey == *employee_account_info.key);
  
      if let Some(employee) = employee {
          // Construct a transfer instruction for the employee
          let transfer_instruction = system_instruction::transfer(
              payroll_account_info.key,
              employee_account_info.key,
              employee.salary,
          );
  
          // Actually invoke the transfer instruction
          invoke(
              &transfer_instruction,
              &[
                  payroll_account_info,
                  employee_account_info,
                  system_program,
              ],
          )?;
      } else {
          return Err(ProgramError::InvalidArgument.into());
      }
  
      Ok(())
  }

    pub fn close(_ctx: Context<CloseSolanaPayroll>, _title: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializeSolanaPayroll<'info> {
    #[account(
      init,
      seeds = [title.as_bytes(), admin.key().as_ref()],
      bump,
      space = 8 + 1000000,
      payer = admin
    )]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CloseSolanaPayroll<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
      mut,
      seeds = [title.as_bytes(), admin.key().as_ref()], 
      bump, 
      close = admin, // close account and return lamports to payer
    )]
    pub solana_payroll: Account<'info, PayrollState>,
}

#[derive(Accounts)]
#[instruction(title: String, salary: u64, name: String)]
pub struct AddEmployee<'info> {
    #[account(
      mut,
      seeds = [title.as_bytes(), admin.key().as_ref()], 
      bump,
    )]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: This is being checked in the function
    pub employee: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct RemoveEmployee<'info> {
    #[account(
      mut,
      seeds = [title.as_bytes(), admin.key().as_ref()], 
      bump, 
    )]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, employee_id: u64, new_salary: u64 )]
pub struct UpdateSalary<'info> {
    #[account(
      mut,
      seeds = [title.as_bytes(), admin.key().as_ref()], 
      bump, 
    )]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PayrollState {
    pub admin: Pubkey,
    pub title: String,
    pub id_counter: u64,
    pub employees: Vec<Employee>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Employee {
    employee_id: u64,
    salary: u64,
    pubkey: Pubkey,
    name: String,
}

#[derive(Accounts)]
pub struct ProcessPayroll<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub payroll_account: Account<'info, PayrollState>,
    /// CHECK: This is not dangerous because we're only passing this to the system program transfer instruction
    pub employee: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}