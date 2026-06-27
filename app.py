from flask import Flask, render_template, abort
import json

app = Flask(__name__)

def load_data():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

@app.context_processor
def inject_data():
    data = load_data()
    return dict(profile=data.get('profile', {}))

@app.route('/')
def home():
    data = load_data()
    return render_template(
        'home.html', 
        projects=data.get('projects', []),
        services=data.get('services', []),
        stats=data.get('stats', []),
        experience=data.get('experience', []),
        education=data.get('education', []),
        skills=data.get('skills', []),
        certificates=data.get('certificates', [])
    )

@app.route('/project/<int:id>')
def project_detail(id):
    data = load_data()
    project = next((p for p in data.get('projects', []) if p['id'] == id), None)
    if not project: abort(404)
    return render_template('project.html', project=project)

if __name__ == '__main__':
    app.run(debug=True)