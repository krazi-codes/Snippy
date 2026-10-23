# Snippy

Snippy orchestrates Anthropic's Claude to cut cost by intelligently routing tasks to the most efficient sub-models.

## Features

- **Intelligent Routing**: Uses a local Ollama model to determine the optimal Claude sub-model for each task
- **Cost Optimization**: 
  - Downshift savings: Using cheaper models for subtasks
  - Cache reuse: Leveraging prompt caching to reduce costs
  - Free routing: Avoiding expensive API calls with local routing
- **Parallel Processing**: Subtasks run in parallel for faster execution
- **Prompt Cache Preservation**: Maintains Claude's prompt cache efficiency
- **Visual Feedback**: Savings tracking in the status bar and collapsible panel

## How It Works

1. User selects a main Claude model per session
2. For each task, a local Ollama router proposes a plan:
   - Which Claude sub-models to use
   - Whether to split into parallel subtasks
3. User can edit the proposed plan
4. Approved subtasks run as stateless, one-shot Claude calls
5. Results are appended to the main conversation to maintain cache efficiency
6. Savings are tracked and displayed

## Setup

1. Install the Snippy extension
2. Configure your Anthropic API key via "Snippy: Set API Key"
3. Set up Ollama locally with a router model (default: llama3.2:3b)
4. Select your main Claude model in settings

## Savings Tracking

Snippy tracks three buckets:
1. **Downshift Savings**: Cost reduction from using cheaper sub-models
2. **Prompt Cache Reuse**: Savings from reusing cached prefixes
3. **Free Local Routing**: Cost avoided by using local Ollama instead of API calls

## Configuration

- `snippy.mainModel`: Main Claude model for the session
- `snippy.maxTokens`: Maximum tokens for Claude responses
- `snippy.enablePromptCache`: Enable prompt cache optimization
- `snippy.ollama.baseUrl`: Base URL for Ollama server
- `snippy.ollama.routerModel`: Ollama model for routing
