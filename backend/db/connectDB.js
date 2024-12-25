import pkg from 'pg';
const {Client}=pkg;

const client=new Client({
    host:"localhost",
    user:"postgres",
    port: 5432,
    password:"root",
    database:"project"
})
client.connect(()=>{
    console.log("DB connected successfully");
})
const insertUser = async (data) => {
    const { username, email, password, verificationToken, verificationTokenExpiresAt } = data;

    
    try {
        const query = `
            INSERT INTO users (username, email, password, verificationtoken, verificationTokenExpiresAt) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`;

        const result = await client.query(query, [username, email, password, verificationToken,verificationTokenExpiresAt]);

        console.log("User inserted successfully", result.rows[0]);
        return result.rows[0]; 
    } catch (err) {
        console.error("Error occurred while signing up user", err);
        throw new Error("Error occurred while signing up user");
    }
};

const findUser = async (data) => {
    const { email } = data;
    try {
        const query = `SELECT *
         FROM users 
         WHERE email=$1`;
        const result = await client.query(query, [email]);
        
        if (result.rows.length > 0) {
            return true; 
        } else {
            return false; 
        }
    } catch (err) {
        console.error("Error occurred while searching for user", err);
        throw new Error("Error occurred while searching for user");
    }
};

const VerifyUser = async (token,email) => {
    try {
        const query = `
            UPDATE users 
            SET isVerified = true, verificationtoken = null 
            WHERE verificationtoken = $1 and email=$2
        `;
        const result = await client.query(query, [token,email]);

        if (result.rowCount === 0) {
            throw new Error("No user found with the provided token");
        }

        console.log("User verified successfully");
    } catch (err) {
        console.error("Error occurred while verifying the user:", err);
        throw new Error("Error occurred while verifying the user");
    }
};

const download_File=async(userId,fileId)=>{
    const query=`SELECT * FROM files WHERE id = $1 AND user_id = $2`
    try{
       const res=await client.query(query,[userId,fileId]);
       if(resule.rowCount===0){
        throw new Error("File Dosent Exists")
       }
       console.log("File Downloaded successfully")
    }catch(err){
        console.error("Error occured while downloading the file",err);
    }
}  

const getFiles=async(userId)=>{
 const query=`SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC`;
 try{
    const result=await client.query(query,[userId])
    if(result.rows.count===0){
        throw new Error('No Files found for this user')
    }
    console.log("Files fetched Successfully.")
    return result
 }catch(err){
    console.log("Error occured while fetching files from db.");
 }
}



export default client;

export {findUser,insertUser,VerifyUser,download_File,getFiles}