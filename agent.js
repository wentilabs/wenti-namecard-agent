require('dotenv').config();
const { OpenAI } = require('openai');

const { getPhotoUrl } = require('./connectors/telegram/utils');
const { appendToSheet } = require('./utils/sheets');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function agentExtraction(message){

    const fieldLabels = {
        full_name: 'Full Name',
        first_name: 'First Name',
        email: 'Email',
        company_name: 'Company',
        mobile: 'Mobile'
    };

    if (!message.photo || message.photo.length === 0) {
        return { success: false, message: "No image found in the message." };
    }
    
    // Get the largest photo version (last in the array)
    const photoId = message.photo[message.photo.length - 1].file_id;
    const photoUrl = await getPhotoUrl(photoId);

    console.log('Telegram photoUrl:', photoUrl);
    
    // Set the mediaUrl for OpenAI to process
    message.mediaUrl = photoUrl;

    const tools = [
        {
            type: 'function',
            name: 'extract_namecard_data',
            description: 'Extract structured data from name card to be inserted into a CRM',
            parameters: {
                type: 'object',
                properties: Object.fromEntries(
                    Object.entries(fieldLabels).map(([key, label]) => [
                        key,
                        { type: 'string', description: label }
                    ])
                ),
                required: Object.keys(fieldLabels)
            }
        }
    ]

    const input = [
        {
            role: 'system',
            content: `You are an assistant that helps to extract structured data from name card images.
            
            Guidelines for extraction:
            - Extact the first name, full name, email, company name and mobile number
            - Compare the email name and the full name to extract the first name
            - Name could be chinese and the first name would be two words and the last name appear at the front
            - Remove all spaces and special character from the mobile number.
            - For mobile number, make sure you remove + sign or any other special characters. The format should just be 6591234567 or 91234567
            `
        },
        {
            role: 'user',
            content: [
                {
                  type: 'input_text',
                  text: `Analyze this name card and extract all structured data.
    
                    Do not reply with a text summary. Only call the function with the extracted data.`,
                },
                {
                  type: 'input_image',
                  image_url: message.mediaUrl, // Updated to use mediaUrl from message object
                }
              ]
        }
    ]

    try {
        console.log('Calling OpenAI for name card extraction');
    
        const response = await openai.responses.create({
          model: 'gpt-4.1',
          input,
          tools,
          store: false
        });

    
        console.log('OpenAI response received for name card extraction');
        
        // Process the response from OpenAI
        if (response.status === 'completed') {
            // Check if there was a tool call in the response
            if (response.output && response.output.length  > 0) {
                const toolCall = response.output[0]; // Get the first tool call
                
                // Parse the tool call arguments
                const extractedData = JSON.parse(toolCall.arguments || '{}');

                
                // Format the extracted data for display
                let formattedResult = "✅ Name Card Extracted\n\n";
                Object.entries(fieldLabels).forEach(([key, label]) => {
                    if (extractedData[key]) {
                        formattedResult += `${label}: ${extractedData[key]}\n`;
                    }
                });
                
                // Save the extracted data to Google Sheets
                try {
                    await appendToSheet(extractedData);
                    console.log('Data successfully saved to Google Sheets');
                } catch (sheetError) {
                    console.error('Failed to save data to Google Sheets:', sheetError);
                }
                
                // Return the formatted results and raw data
                return {
                    success: true,
                    message: formattedResult,
                    rawData: extractedData
                };
            } else {
                // If no tool call was made, check if there's a message
                if (response.content && response.content.length > 0) {
                    return {
                        success: false,
                        message: "This doesn't appear to be a business card. Please upload a clear image of a business card.",
                        rawData: null
                    };
                }
            }
        }
        
        // Fallback message if we couldn't extract meaningful data
        return {
            success: false,
            message: "I couldn't extract information from this image. Please upload a clearer image of a business card and make sure the name card is upright.",
            rawData: null
        };
    } catch (error) {
        console.error('Error in agentExtraction:', error);
        return {
            success: false,
            message: "An error occurred while processing the image. Please try again later.",
            error: error.message
        };
    }

}

module.exports = { agentExtraction };