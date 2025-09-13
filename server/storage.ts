import { 
  type User, 
  type InsertUser, 
  type Community, 
  type InsertCommunity,
  type Message,
  type InsertMessage,
  type Article,
  type InsertArticle,
  type CommunityMember,
  type InsertCommunityMember,
  type CommunityWithAuthor,
  type MessageWithAuthor,
  type ArticleWithAuthor
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Communities
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunities(search?: string): Promise<CommunityWithAuthor[]>;
  getUserCommunities(userId: string): Promise<CommunityWithAuthor[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, community: Partial<InsertCommunity>): Promise<Community | undefined>;

  // Community Members
  joinCommunity(communityId: string, userId: string): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<boolean>;
  getCommunityMembers(communityId: string): Promise<User[]>;
  isUserInCommunity(communityId: string, userId: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getCommunityMessages(communityId: string, limit?: number): Promise<MessageWithAuthor[]>;
  getDirectMessages(userId1: string, userId2: string, limit?: number): Promise<MessageWithAuthor[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Articles
  getArticle(id: string): Promise<Article | undefined>;
  getArticles(search?: string, authorId?: string): Promise<ArticleWithAuthor[]>;
  getUserArticles(userId: string): Promise<ArticleWithAuthor[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  likeArticle(id: string): Promise<Article | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private communities: Map<string, Community> = new Map();
  private communityMembers: Map<string, CommunityMember> = new Map();
  private messages: Map<string, Message> = new Map();
  private articles: Map<string, Article> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunities(search?: string): Promise<CommunityWithAuthor[]> {
    let communities = Array.from(this.communities.values());
    
    if (search) {
      communities = communities.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return Promise.all(communities.map(async (community) => {
      const author = await this.getUser(community.createdBy);
      return {
        ...community,
        author: author!,
      };
    }));
  }

  async getUserCommunities(userId: string): Promise<CommunityWithAuthor[]> {
    const userMemberships = Array.from(this.communityMembers.values())
      .filter(member => member.userId === userId);
    
    const communities = await Promise.all(
      userMemberships.map(async (membership) => {
        const community = this.communities.get(membership.communityId);
        if (!community) return null;
        
        const author = await this.getUser(community.createdBy);
        return {
          ...community,
          author: author!,
          isMember: true,
        };
      })
    );

    return communities.filter(Boolean) as CommunityWithAuthor[];
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const id = randomUUID();
    const community: Community = {
      ...insertCommunity,
      id,
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.communities.set(id, community);
    
    // Auto-join creator
    await this.joinCommunity(id, insertCommunity.createdBy);
    
    return community;
  }

  async updateCommunity(id: string, updateData: Partial<InsertCommunity>): Promise<Community | undefined> {
    const community = this.communities.get(id);
    if (!community) return undefined;
    
    const updatedCommunity = { ...community, ...updateData, updatedAt: new Date() };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }

  // Community Members
  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const id = randomUUID();
    const member: CommunityMember = {
      id,
      communityId,
      userId,
      role: 'member',
      joinedAt: new Date(),
    };
    
    this.communityMembers.set(id, member);
    
    // Update member count
    const community = this.communities.get(communityId);
    if (community) {
      community.memberCount += 1;
      this.communities.set(communityId, community);
    }
    
    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    const memberKey = Array.from(this.communityMembers.entries())
      .find(([_, member]) => member.communityId === communityId && member.userId === userId)?.[0];
    
    if (!memberKey) return false;
    
    this.communityMembers.delete(memberKey);
    
    // Update member count
    const community = this.communities.get(communityId);
    if (community && community.memberCount > 0) {
      community.memberCount -= 1;
      this.communities.set(communityId, community);
    }
    
    return true;
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    const memberIds = Array.from(this.communityMembers.values())
      .filter(member => member.communityId === communityId)
      .map(member => member.userId);
    
    const members = await Promise.all(
      memberIds.map(id => this.getUser(id))
    );
    
    return members.filter(Boolean) as User[];
  }

  async isUserInCommunity(communityId: string, userId: string): Promise<boolean> {
    return Array.from(this.communityMembers.values())
      .some(member => member.communityId === communityId && member.userId === userId);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getCommunityMessages(communityId: string, limit = 50): Promise<MessageWithAuthor[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.communityId === communityId && message.type === 'community')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await this.getUser(message.authorId);
        return {
          ...message,
          author: author!,
        };
      })
    );

    return messagesWithAuthors.reverse();
  }

  async getDirectMessages(userId1: string, userId2: string, limit = 50): Promise<MessageWithAuthor[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => 
        message.type === 'direct' &&
        ((message.authorId === userId1 && message.recipientId === userId2) ||
         (message.authorId === userId2 && message.recipientId === userId1))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await this.getUser(message.authorId);
        return {
          ...message,
          author: author!,
        };
      })
    );

    return messagesWithAuthors.reverse();
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    
    this.messages.set(id, message);
    return message;
  }

  // Articles
  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticles(search?: string, authorId?: string): Promise<ArticleWithAuthor[]> {
    let articles = Array.from(this.articles.values())
      .filter(article => article.published);
    
    if (search) {
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        article.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (authorId) {
      articles = articles.filter(article => article.authorId === authorId);
    }
    
    articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(articles.map(async (article) => {
      const author = await this.getUser(article.authorId);
      return {
        ...article,
        author: author!,
      };
    }));
  }

  async getUserArticles(userId: string): Promise<ArticleWithAuthor[]> {
    const articles = Array.from(this.articles.values())
      .filter(article => article.authorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const author = await this.getUser(userId);
    
    return articles.map(article => ({
      ...article,
      author: author!,
    }));
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: string, updateData: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, ...updateData, updatedAt: new Date() };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  async likeArticle(id: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    article.likes += 1;
    this.articles.set(id, article);
    return article;
  }
}

export const storage = new MemStorage();
