// This code can be used to add a custom javascript function to any Google Spreadsheet, much like
// how VBA can be used to create custom functions in Excel. This shows a function with 0, 1 or 2 
// inputs. 

// To use:
// Paste this text into "Tools > Script Editor..." for any google sheet
// In a cell, enter =check()  /or/ =check("hello")   /or/  check("hello", "world")
// This can then be used to attach any GAS or JavaScript code to your spreadsheet!


function check(input) {
  
  if(!input[1]) {
    if (!input[0]){
      return "It Worked!"
    }
    else {
      return "It Worked! :: " + input[0]
    }
  }
  else {
    return "It Worked! :: " + input[0] + " :: " + input[1]
  }
  
  
}
