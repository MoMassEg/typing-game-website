const express = require("express")
const mongoose = require('mongoose')
const cors = require("cors")
const EmployeeModel = require('./models/Employee')
const DataModel = require('./models/data')
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

const app = express()
app.use(express.json())
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/employee")

app.post("/login", (req,res)=>{
    const {email,password} = req.body;
    EmployeeModel.findOne({email: email})
    .then(employees=>{
        if(employees){
            if(employees.password === password){
                res.cookie("userId", employees.id, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000,sameSite: "lax", secure: false },);
                res.json("Success")
            }else{
                res.json("the password is incorrect")
            }
        }else{
            res.json("No record existed")
        }
    })
})

 app.post('/Signup',(req,res)=>{
    const {name,email,password} = req.body;
    const role = "user"
    const id = uuidv4(); 

    EmployeeModel.create({ name, email, password, role, id })
    .then(employees =>res.json(employees))
    .catch(err => res.json(err))

 })

 app.post("/logout", (req, res) => {
    res.clearCookie("userId", {
        httpOnly: true,
        sameSite: "lax",
        secure: false 
    });
    res.json({ message: "User logged out and cookie deleted" });
});

app.get("/employee/:id", async (req, res) => {
    console.log("Received ID:", req.params.id);
    try {
        const employee = await EmployeeModel.findOne({ id: req.params.id });
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: "Employee not found" });
        }
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/dashboard", async (req, res) => {
    try {
        const employees = await EmployeeModel.find(); 
        if (employees && employees.length > 0) {
            res.json(employees); 
        } else {
            res.status(404).json({ message: "No employees found" });
        }
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ message: "Server error" });
    }
});
app.put("/dashboard/make-admin/:id", async (req, res) => {
    try {
        const { id } = req.params; 
        const updatedEmployee = await EmployeeModel.findOneAndUpdate(
            { id }, 
            { role: "admin" }, 
            { new: true }     
        );
        if (updatedEmployee) {
            res.json(updatedEmployee); 
        } else {
            res.status(404).json({ message: "Employee not found" }); 
        }
    } catch (error) {
        console.error("Error making employee admin:", error);
        res.status(500).json({ message: "Server error" }); 
    }
});

app.put("/dashboard/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body; 
        const updatedEmployee = await EmployeeModel.findOneAndUpdate(
            { id }, 
            { name, email, password }, 
            { new: true } 
        );
        if (updatedEmployee) {
            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: "Employee not found" });
        }
    } catch (error) {
        console.error("Error editing employee:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.delete("/dashboard/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEmployee = await EmployeeModel.findOneAndDelete({ id });
        if (deletedEmployee) {
            res.json({ message: "Employee deleted successfully" });
        } else {
            res.status(404).json({ message: "Employee not found" });
        }
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ message: "Server error" });
    }
});
app.get("/dashboard/search", async (req, res) => {
    try {
        const { name } = req.query; 
        if (!name) {
            return res.status(400).json({ message: "Name query is required" });
        }

        const employees = await EmployeeModel.find({ 
            name: { $regex: name, $options: 'i' } 
        });

        if (employees.length > 0) {
            res.json(employees);
        } else {
            res.status(404).json({ message: "No employees found" });
        }
    } catch (error) {
        console.error("Error searching employees:", error);
        res.status(500).json({ message: "Server error" });
    }
});





app.post('/data', async (req, res) => {
    try {
      const { Mistakes, WPM, CMP, id } = req.body;
  
      const newRecord = new DataModel({
        Mistakes,
        WPM,
        CMP,
        id,
      });
  
      await newRecord.save();
  
      res.status(201).json({ message: 'Data saved successfully', data: newRecord });
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ message: 'Failed to save data', error });
    }
  });

  app.get("/getdata", async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        const employeeData = await DataModel.find({ id: userId });

        if (employeeData && employeeData.length > 0) {
            res.json(employeeData);
        } else {
            res.status(404).json({ message: "No data found for the user" });
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/getleaderboard", async (req, res) => {
    try {
        const employeeData = await DataModel.find().sort({ WPM: -1 }).limit(10); // Get top 10 WPM records

        if (employeeData && employeeData.length > 0) {
            res.json(employeeData);
        } else {
            res.status(404).json({ message: "No leaderboard data found" });
        }
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(3001, ()=>{
    console.log("server is running")
})