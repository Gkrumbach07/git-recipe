import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerPrompts(server: McpServer) {
  server.registerPrompt('add-recipe', {
    title: 'Add Recipe',
    description: 'Tell me about a recipe and I\'ll add it to your cookbook.',
    argsSchema: {
      cookbook: z.string().optional().describe('Cookbook name (owner/repo). If omitted, I\'ll ask or pick your default.'),
    },
  }, async ({ cookbook }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `I want to add a new recipe${cookbook ? ` to ${cookbook}` : ''}. Please ask me about the recipe — what it's called, ingredients, instructions, and any metadata like servings, tags, and source. Then use the create_recipe tool to save it.`,
        },
      }],
    }
  })

  server.registerPrompt('import-recipe', {
    title: 'Import Recipe',
    description: 'Give me a URL and I\'ll import the recipe into your cookbook.',
    argsSchema: {
      url: z.string().describe('URL of the recipe to import'),
      cookbook: z.string().optional().describe('Target cookbook (owner/repo)'),
    },
  }, async ({ url, cookbook }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please import the recipe from ${url}${cookbook ? ` into ${cookbook}` : ''}. Use the import_from_url tool to fetch and save it, then review the result and clean up the formatting if needed.`,
        },
      }],
    }
  })

  server.registerPrompt('weekly-meal-plan', {
    title: 'Weekly Meal Plan',
    description: 'I\'ll look at your recipes and suggest a weekly meal plan.',
    argsSchema: {
      cookbook: z.string().describe('Cookbook name (owner/repo)'),
      preferences: z.string().optional().describe('Any dietary preferences or constraints'),
    },
  }, async ({ cookbook, preferences }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please create a weekly meal plan using recipes from my cookbook ${cookbook}. List all available recipes using list_recipes and read_recipe, then suggest a balanced plan for 7 days.${preferences ? ` Preferences: ${preferences}` : ''} Include breakfast, lunch, and dinner suggestions.`,
        },
      }],
    }
  })

  server.registerPrompt('find-recipe', {
    title: 'Find Recipe',
    description: 'Describe what you\'re in the mood for and I\'ll search your cookbooks.',
    argsSchema: {
      query: z.string().describe('What kind of recipe are you looking for?'),
      cookbook: z.string().optional().describe('Cookbook to search (owner/repo). If omitted, searches all.'),
    },
  }, async ({ query, cookbook }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `I'm looking for: ${query}. ${cookbook ? `Search in ${cookbook}` : 'Search across all my cookbooks'} using the search_recipes tool. Show me matching recipes with their key details (servings, tags, source).`,
        },
      }],
    }
  })
}
