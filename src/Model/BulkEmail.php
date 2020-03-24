<?php

namespace App\Model;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Model for the bulk email form type.
 */
class BulkEmail
{
  /**
   * The email subject.
   *
   * @var string
   * @Assert\NotBlank(message="Email subject cannot be blank.")
   */
  private $subject;

  /**
   * The email content.
   *
   * @var string
   * @Assert\NotBlank(message="Email content cannot be blank.")
   */
  private $content;

  /**
   * Get the email subject.
   *
   * @return string|null
   */
  public function getSubject(): ?string
  {
    return $this->subject;
  }

  /**
   * Set the email address.
   *
   * @param string
   * @return self
   */
  public function setSubject(string $subject): self
  {
    $this->subject = $subject;
    return $this;
  }

  /**
   * Get the email content.
   *
   * @return string|null
   */
  public function getContent(): ?string
  {
    return $this->content;
  }

  /**
   * Set the email content.
   *
   * @param string
   * @return self
   */
  public function setContent(string $content): self
  {
    $this->content = $content;
    return $this;
  }
}
