import re
import joblib
import pandas as pd
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Load the trained model and vectorizer at startup
print("Loading model and vectorizer...")
import os
model_dir = os.path.dirname(__file__)  # Get the directory of this script
model_path = os.path.join(model_dir, 'model.pkl')
vectorizer_path = os.path.join(model_dir, 'vectorizer.pkl')

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)
print("Model and vectorizer loaded successfully!")

def clean_text(text: str) -> str:
    """Enhanced text cleaning for hate speech detection - matches training preprocessing."""
    if pd.isna(text) or text is None:
        return ""
    text = str(text).lower()
    
    # Preserve important characters that might be in offensive words
    # Remove excessive punctuation but keep apostrophes and basic symbols
    text = re.sub(r'[^\w\s\']', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Handle common leetspeak and symbol replacements for consistency with training
    replacements = {
        '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', 
        '7': 't', '$': 's', '!': 'i', '+': 't'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text

@app.route('/predict', methods=['POST'])
def predict():
    """Predict hate speech for given text."""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field in JSON payload'}), 400
        
        # Get and clean the text
        text = data['text']
        cleaned_text = clean_text(text)
        
        if not cleaned_text:
            return jsonify({'error': 'Empty text after cleaning'}), 400
        
        # Transform text with vectorizer
        text_tfidf = vectorizer.transform([cleaned_text])
        
        # Make prediction (1 = hate speech, 0 = non-hate)
        prediction = model.predict(text_tfidf)[0]
        
        # Return result
        return jsonify({'hate': bool(prediction)})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'model_loaded': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)