import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCommunitySchema, 
  insertMessageSchema, 
  insertArticleSchema,
  insertCommunityMemberSchema
} from "@shared/schema";
import { z } from "zod";

declare module 'express-session' {
  interface SessionData {
    adminAuth?: boolean;
  }
}

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Enhanced middleware to handle both admin sessions and Firebase auth
const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check for admin session first
  if (req.session?.adminAuth) {
    // Create mock admin user for API compatibility
    req.user = {
      id: 'admin-user',
      email: 'admin@system.local',
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      name: 'Admin',
      avatar: null,
      title: 'System Administrator',
      location: null,
      bio: 'System Administrator',
      skills: ['Administration', 'System Management'],
      github: null,
      linkedin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return next();
  }
  
  // Fall back to Firebase authentication
  const userEmail = req.headers['x-user-email'] as string;
  const userName = req.headers['x-user-name'] as string;
  
  if (!userEmail || !userName) {
    return res.status(401).json({ message: "Authentication required" });
  }

  let user = await storage.getUserByEmail(userEmail);
  if (!user) {
    // Create user if doesn't exist
    user = await storage.createUser({
      email: userEmail,
      name: userName,
      bio: "",
      skills: [],
    });
  }
  
  req.user = user;
  next();
};

// Admin authentication middleware
const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.adminAuth) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket Server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    const userEmail = req.url?.split('userEmail=')[1]?.split('&')[0];
    if (userEmail) {
      clients.set(userEmail, ws);
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'community_message') {
          const savedMessage = await storage.createMessage({
            content: message.content,
            authorId: message.authorId,
            communityId: message.communityId,
            type: 'community',
          });
          
          // Broadcast to all community members
          const members = await storage.getCommunityMembers(message.communityId);
          const messageWithAuthor = {
            ...savedMessage,
            author: await storage.getUser(message.authorId),
          };
          
          members.forEach(member => {
            if (member.email) {
              const memberWs = clients.get(member.email);
              if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                memberWs.send(JSON.stringify({
                  type: 'community_message',
                  message: messageWithAuthor,
                }));
              }
            }
          });
        } else if (message.type === 'direct_message') {
          const savedMessage = await storage.createMessage({
            content: message.content,
            authorId: message.authorId,
            recipientId: message.recipientId,
            type: 'direct',
          });
          
          const messageWithAuthor = {
            ...savedMessage,
            author: await storage.getUser(message.authorId),
          };
          
          // Send to recipient
          const recipient = await storage.getUser(message.recipientId);
          if (recipient && recipient.email) {
            const recipientWs = clients.get(recipient.email);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'direct_message',
                message: messageWithAuthor,
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userEmail) {
        clients.delete(userEmail);
      }
    });
  });

  // API Routes
  
  // Admin authentication routes
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // Check hardcoded admin credentials
    if (username === 'admin' && password === '123') {
      req.session.adminAuth = true;
      res.json({ success: true, message: 'Admin authenticated successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  });
  
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    req.session.adminAuth = false;
    res.json({ success: true, message: 'Admin logged out successfully' });
  });
  
  // Admin status check
  app.get('/api/admin/status', (req: Request, res: Response) => {
    res.json({ isAuthenticated: !!req.session?.adminAuth });
  });
  
  // User routes
  app.get('/api/user/profile', authenticateUser, async (req: AuthenticatedRequest, res) => {
    res.json(req.user);
  });

  app.put('/api/user/profile', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  // Community routes
  app.get('/api/communities', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const search = req.query.search as string;
    const communities = await storage.getCommunities(search);
    
    // Check if user is member of each community
    const communitiesWithMembership = await Promise.all(
      communities.map(async (community) => ({
        ...community,
        isMember: await storage.isUserInCommunity(community.id, req.user.id),
      }))
    );
    
    res.json(communitiesWithMembership);
  });

  app.get('/api/communities/user', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const communities = await storage.getUserCommunities(req.user.id);
    res.json(communities);
  });

  app.get('/api/communities/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const community = await storage.getCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    const author = await storage.getUser(community.createdBy);
    const isMember = await storage.isUserInCommunity(community.id, req.user.id);
    
    res.json({
      ...community,
      author,
      isMember,
    });
  });

  app.post('/api/communities', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const communityData = insertCommunitySchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      const community = await storage.createCommunity(communityData);
      res.status(201).json(community);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.post('/api/communities/:id/join', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const alreadyMember = await storage.isUserInCommunity(req.params.id, req.user.id);
      if (alreadyMember) {
        return res.status(409).json({ message: 'Already a member' });
      }
      
      const membership = await storage.joinCommunity(req.params.id, req.user.id);
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ message: 'Failed to join community' });
    }
  });

  app.delete('/api/communities/:id/leave', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.leaveCommunity(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({ message: 'Not a member' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to leave community' });
    }
  });

  app.get('/api/communities/:id/members', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const members = await storage.getCommunityMembers(req.params.id);
    res.json(members);
  });

  // Message routes
  app.get('/api/communities/:id/messages', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await storage.getCommunityMessages(req.params.id, limit);
    res.json(messages);
  });

  app.get('/api/messages/:userId', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await storage.getDirectMessages(req.user.id, req.params.userId, limit);
    res.json(messages);
  });

  // Article routes
  app.get('/api/articles', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const search = req.query.search as string;
    const authorId = req.query.authorId as string;
    const articles = await storage.getArticles(search, authorId);
    res.json(articles);
  });

  app.get('/api/articles/user', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const articles = await storage.getUserArticles(req.user.id);
    res.json(articles);
  });

  app.get('/api/articles/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const article = await storage.getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const author = await storage.getUser(article.authorId);
    res.json({
      ...article,
      author,
    });
  });

  app.post('/api/articles', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const articleData = insertArticleSchema.parse({
        ...req.body,
        authorId: req.user.id,
      });
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.put('/api/articles/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      if (article.authorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updateData = insertArticleSchema.partial().parse(req.body);
      const updatedArticle = await storage.updateArticle(req.params.id, updateData);
      res.json(updatedArticle);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.delete('/api/articles/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      if (article.authorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const success = await storage.deleteArticle(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete article' });
    }
  });

  app.post('/api/articles/:id/like', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.likeArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: 'Failed to like article' });
    }
  });

  // Saved Articles routes
  app.get('/api/articles/saved', authenticateUser, async (req: AuthenticatedRequest, res) => {
    const savedArticles = await storage.getSavedArticles(req.user.id);
    res.json(savedArticles);
  });

  app.post('/api/articles/:id/save', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      const alreadySaved = await storage.isArticleSaved(req.user.id, req.params.id);
      if (alreadySaved) {
        return res.status(409).json({ message: 'Article already saved' });
      }

      const savedArticle = await storage.saveArticle(req.user.id, req.params.id);
      res.status(201).json(savedArticle);
    } catch (error) {
      res.status(500).json({ message: 'Failed to save article' });
    }
  });

  app.delete('/api/articles/:id/unsave', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.unsaveArticle(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Article not saved' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsave article' });
    }
  });

  return httpServer;
}
