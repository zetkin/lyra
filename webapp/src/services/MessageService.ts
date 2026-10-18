import { MessageDto } from '@/dto/MessageDto';

export class MessageService {
  public getMessages(projectName: string, lang: string): MessageDto[] {
    //TODO: connect with DAO's
    return [];
  }
}
